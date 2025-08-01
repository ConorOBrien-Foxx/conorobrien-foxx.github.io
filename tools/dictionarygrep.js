const DICTIONARY_SOURCES = [
    {
        url: "https://raw.githubusercontent.com/first20hours/google-10000-english/refs/heads/master/google-10000-english.txt",
        name: "10k first20hours/google-10000-english",
        cachedList: null,
    },
    {
        url: "https://gist.githubusercontent.com/eyturner/3d56f6a194f411af9f29df4c9d4a4e6e/raw/63b6dbaf2719392cb2c55eb07a6b1d4e758cc16d/20k.txt",
        name: "20k eyturner/20k.txt",
        cachedList: null,
    },
    {
        url: "./princeton-words.shakespeare.txt",
        name: "29k princeton/words.shakespeare.txt",
        cachedList: null,
    },
    {
        url: "./umich-jlawler-wordlist.txt",
        name: "69k ~jlawler/wordlist",
        cachedList: null,
    },
    {
        url: "https://raw.githubusercontent.com/open-dict-data/ipa-dict/refs/heads/master/data/en_US.txt",
        name: "125k open-dict-data/ipa-dict",
        cachedList: null,
    },
    {
        url: "https://raw.githubusercontent.com/redbo/scrabble/refs/heads/master/dictionary.txt",
        name: "179k redbo/scrabble",
        cachedList: null,
    },
    {
        url: "https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words_alpha.txt",
        name: "370k dwyl/english-words",
        cachedList: null,
    },
];
const DICTIONARY_SOURCES_ADDRESSED = {};

registerApps(".dictionary-grep-app", app => {
    let input = app.querySelector(".regex-input");
    let caseSensitive = app.querySelector(".regex-case-sensitive");
    let select = app.querySelector(".word-sets");
    let submit = app.querySelector(".submit");
    let output = app.querySelector(".filtered-words");
    let sortOrder = app.querySelector(".sort-order");
    let sortAscending = app.querySelector(".sort-ascending");
    output.value = "";
    
    Object.defineProperty(window, "dictionary", {
        get() {
            return DICTIONARY_SOURCES_ADDRESSED[select.value].cachedList;
        }
    }); 
    
    const filterResults = async function () {
        let list = DICTIONARY_SOURCES_ADDRESSED[select.value];
        if(list.cachedList === null) {
            let toast = new Toast("Downloading word list...", {
                cancellable: false,
                useTimeout: false,
                timeout: 1000,
            });
            toast.show();
            let response;
            try {
                response = await fetch(list.url);
            }
            catch(e) {
                console.error(e);
                toast.killWithTimeout();
                showToast("Error while networking (check console)");
                return;
            }
            if(!response.ok) {
                console.error(response.status);
                toast.killWithTimeout();
                showToast(`Error while networking (Error ${response.status})`);
                return;
            }
            let text = await response.text();
            let sizeInKiloBytes = text.length / 1000;
            // console.log(text);
            list.cachedList = text.trim().split("\n").map(e => e.trim());
            toast.killWithTimeout();
            showToast(`Downloaded list, ${sizeInKiloBytes.toFixed(1)}kB`);
        }
        let flags = caseSensitive.checked ? "" : "i";
        let regex = new RegExp(input.value, flags);
        let results = list.cachedList.filter(word => regex.test(word));
        switch(sortOrder.value) {
            case "default":
                break;
            case "alpha-case-sensitive":
                // results.sort((a, b) => a.localeCompare(b));
                results.sort();
                break;
            case "alpha-case-insensitive":
                results.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                break;
            case "word-length":
                results.sort((a, b) => a.length - b.length);
                break;
            default:
                console.error("Unimplemented sort order", sortOrder.value);
                break;
        }
        if(!sortAscending.checked) {
            results.reverse();
        }
        output.value = `${results.length} result${results.length === 1 ? "" : "s"} found:\n${results.join("\n")}`;
    };
    
    input.addEventListener("keydown", ev => {
        if(ev.key === "Enter" && !ev.ctrlKey) {
            filterResults();
        }
    });
    
    DICTIONARY_SOURCES.forEach(obj => {
        DICTIONARY_SOURCES_ADDRESSED[obj.name] ??= obj;
        let option = document.createElement("option");
        option.textContent = option.value = obj.name;
        select.appendChild(option);
    });
    
    submit.addEventListener("click", filterResults);
});
