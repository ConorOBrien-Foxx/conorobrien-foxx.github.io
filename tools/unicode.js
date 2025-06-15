// higher is better
const intrinsicRelevancy = resultEntry => {
    let relevancy = 0;
    if(resultEntry.name.includes("MODIFIER")) {
        relevancy -= 3;
    }
    if(resultEntry.name.includes("COMBINING")) {
        relevancy -= 3;
    }
    if(resultEntry.name.includes("ABOVE") || resultEntry.name.includes("BELOW")) {
        relevancy -= 3;
    }
    if(resultEntry.name.includes("<") || resultEntry.alts.some(alt => alt.includes("<"))) {
        relevancy -= 30;
    }
    return relevancy;
};


const wordsOf = str => str.trim().split(/\s+/);
const makeFuzzy = query => ({
    base: query.toUpperCase(),
    words: wordsOf(query.toUpperCase()),
});

const fuzzyMatch = (query, entry) => {
    let relevancy = 0;
    let matches = false;
    
    if(entry.name === query.base || query.base === String.fromCodePoint(entry.dec) || (query.base.length <= 4 && query.base.padStart(4, "0") === entry.hex)) {
        matches = true;
        relevancy = Infinity;
    }
    else {
        matches = query.words.every(word => entry.name.includes(word));
        wordsOf(entry.name).forEach(entryWord => {
            if(query.words.includes(entryWord)) {
                relevancy += 3;
            }
        });
        relevancy -= entry.name.length;
    }
    
    relevancy += intrinsicRelevancy(entry);
    
    return {
        matches,
        relevancy,
        entry,
    };
};

registerApps(".unicode-lookup-app", app => {
    let resultsOutput = app.querySelector(".unicode-results");
    let searchInput = app.querySelector(".unicode-search-bar");
    let databaseRows;
    
    const AppConfig = {
        MaxResults: 1000,
    };
    
    let queuedSearchQuery = null;
    let searchTicket = 0;
    
    const searchUnicode = query => {
        if(!databaseRows) {
            showToast("Loading resources...");
            queuedSearchQuery = query;
            return;
        }
        
        let myTicket = ++searchTicket;
        
        let fuzzyQuery = makeFuzzy(query);
        let searchResults = [];
        clearChildren(resultsOutput);

        for(let dbEntry of databaseRows) {
            let fuzzyResult = fuzzyMatch(fuzzyQuery, dbEntry);
            if(fuzzyResult.matches) {
                searchResults.push(fuzzyResult);
                if(searchResults.length >= AppConfig.MaxResults) {
                    break;
                }
            }
        }
        
        searchResults.sort((a, b) => b.relevancy - a.relevancy);
        
        return iterateChunked(searchResults, fuzzyResult => {
            if(myTicket < searchTicket) {
                return iterateChunked.BREAK;
            }
            let dbEntry = fuzzyResult.entry;
            // console.log(dbEntry);
            let row = document.createElement("tr");
            row.classList.add("hoverable");
            let symbolCell = document.createElement("td");
            symbolCell.textContent = String.fromCodePoint(dbEntry.dec);
            symbolCell.classList.add("symbol");
            row.appendChild(symbolCell);
            let cells = [
                dbEntry.hex,
                dbEntry.name,
                // dbEntry.name,
            ].forEach(cell => {
                let td = document.createElement("td");
                td.textContent = cell;
                row.appendChild(td);
            });
            row.dataset.relevancy = fuzzyResult.relevancy;
            resultsOutput.appendChild(row);
        });
    };
    
    fetch("./unicode.json")
        .then(req => req.json())
        .then(res => {
            databaseRows = res;
            if(queuedSearchQuery) {
                showToast("Resources loaded!");
                searchUnicode(queuedSearchQuery);
            }
        });
    
    resultsOutput.addEventListener("click", ev => {
        let target = ev.target.closest(".hoverable");
        if(!target) {
            return;
        }
        
        if(ev.altKey) {
            showToast(`Rel for ${target.querySelector("td:nth-child(3)").textContent}: ${target.dataset.relevancy}`);
            return;
        }
        
        let selection = window.getSelection()?.getRangeAt(0);
        if(selection && selection.startOffset < selection.endOffset) {
            // do not override their selection
            return;
        }
        
        let symbolCell = target.querySelector("td:first-child");
        let copyContent = symbolCell.textContent;
        let dummyInput = document.createElement("input");
        dummyInput.value = copyContent;
        document.body.appendChild(dummyInput);
        copyTextToClipboard(dummyInput);
        dummyInput.remove();
        showToast(`Copied ${copyContent} to clipboard!`);
    });
    
    if(searchInput.value) {
        searchUnicode(searchInput.value);
    }
    searchInput.addEventListener("input", () => {
        searchUnicode(searchInput.value);
    });
});
