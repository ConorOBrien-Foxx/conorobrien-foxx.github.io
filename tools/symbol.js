const SYMBOLS = [
    {
        "symbol": "•",
        "name": "bullet"
    },
    {
        "symbol": "●",
        "name": "large bullet"
    },
    {
        "symbol": "←",
        "name": "left arrow",
    },
    {
        "symbol": "→",
        "name": "right arrow",
    },
    {
        "symbol": "↑",
        "name": "up arrow",
    },
    {
        "symbol": "↓",
        "name": "down arrow",
    },
    {
        "symbol": "≈",
        "name": "approximately equal to",
    },
    {
        "symbol": "≤",
        "name": "less than or equal to",
    },
    {
        "symbol": "≥",
        "name": "greater than or equal to",
    },
    {
        "symbol": "–",
        "name": "en dash",
    },
    {
        "symbol": "—",
        "name": "em dash",
    },
    {
        "symbol": "█",
        "name": "redact/censor",
    },
    {
        "symbol": "§",
        "name": "section",
    },
    {
        "symbol": "©",
        "name": "copyright",
    },
    {
        "symbol": "™",
        "name": "tm trademark",
    },
    {
        "symbol": "®",
        "name": "all rights reserved",
    },
    {
        "symbol": "『",
        "name": "japanese double open quote",
    },
    {
        "symbol": "』",
        "name": "japanese double close quote",
    },
    {
        "symbol": "「",
        "name": "japanese single open quote",
    },
    {
        "symbol": "」",
        "name": "japanese single close quote",
    },
    {
        "symbol": "¥",
        "name": "japanese yen",
    },
    {
        "symbol": "×",
        "name": "multiplication times",
    },
    {
        "symbol": "·",
        "name": "center dot/cdot multiplication",
    },
    {
        "symbol": "÷",
        "name": "division",
    },
    {
        "symbol": "∞",
        "name": "infinity",
    },
    {
        "symbol": "∈",
        "name": "element of",
    },
    {
        "symbol": "∉",
        "name": "not element of",
    },
    {
        "symbol": "⊆",
        "name": "subset equal",
    },
    {
        "symbol": "⊂",
        "name": "proper subset",
    },
    {
        "symbol": "⊇",
        "name": "superset equal",
    },
    {
        "symbol": "⊂",
        "name": "proper superset",
    },
    {
        "symbol": "∴",
        "name": "therefore",
    },
    {
        "symbol": "∵",
        "name": "because",
    },
    {
        "symbol": "⊥",
        "name": "contradiction/bottom",
    },
    {
        "symbol": "⊤",
        "name": "tautology/top",
    },
    {
        "symbol": "∎",
        "name": "filled qed",
    },
    {
        "symbol": "□",
        "name": "hollow qed",
    },
];

class SymbolSearchRenderer {
    constructor(app) {
        this.app = app;
        this.elements = {
            searchBar: app.querySelector(".symbol-search-bar"),
            results: app.querySelector(".symbol-results"),
        };
    }
    
    renderResult(symbolInfo) {
        let el = document.createElement("div");
        el.classList.add("single-result");
        let heading = document.createElement("h3");
        heading.classList.add("result-title");
        heading.textContent = symbolInfo.name;
        let button = document.createElement("button");
        button.classList.add("symbol");
        button.textContent = symbolInfo.symbol;
        let input = document.createElement("input");
        input.type = "text";
        input.value = symbolInfo.symbol;
        input.classList.add("center");
        el.appendChild(heading);
        el.appendChild(button);
        el.appendChild(input);
        
        button.addEventListener("click", ev => {
            copyTextToClipboard(input);
            showToast("Copied to clipboard!");
        });
        
        return el;
    }
    
    updateResults() {
        clearChildren(this.elements.results);
        let filteredSymbols = this.getSearchResults();
        for(let symbolInfo of filteredSymbols) {
            let result = this.renderResult(symbolInfo);
            this.elements.results.appendChild(result);
        }
    }
    
    getSearchResults(query = null) {
        query ??= this.elements.searchBar.value;
        query = query.toLowerCase();
        // TODO: do we need to optimize this?
        // we could also do some kind of internal pagination/batch filtration so we don't stall the webpage with particularly long queries
        return SYMBOLS.filter(symbolInfo =>
            symbolInfo.name.includes(query) || symbolInfo.symbol.includes(query)
        );
    }
    
    
    start() {
        this.elements.searchBar.addEventListener("input", () => this.updateResults());
        this.updateResults();
        this.elements.searchBar.focus();
    }
}

registerApps(".symbol-lookup-app", app => {
    let renderer = new SymbolSearchRenderer(app);
    renderer.start();
});
