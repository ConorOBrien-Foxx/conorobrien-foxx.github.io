const DICTIONARY_SOURCES = [
    {
        url: "https://raw.githubusercontent.com/first20hours/google-10000-english/refs/heads/master/google-10000-english.txt",
        name: "10k first20hours/google-10000-english",
        cachedList: null,
    },
    {
        url: "https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words_alpha.txt",
        name: "466k dwyl/english-words",
        cachedList: null,
    },
];
const DICTIONARY_SOURCES_ADDRESSED = {};

registerApps(".dictionary-grep-app", app => {
    let input = app.querySelector(".regex-input");
    let select = app.querySelector(".word-sets");
    let submit = app.querySelector(".submit");
    let output = app.querySelector(".filtered-words");
    output.value = "";
    
    const filterResults = async function () {
        let list = DICTIONARY_SOURCES_ADDRESSED[select.value];
        if(list.cachedList === null) {
            let toast = new Toast("Downloading word list...", {
                cancellable: false,
                useTimeout: false,
                timeout: 1000,
            });
            toast.show();
            let response = await fetch(list.url);
            let text = await response.text();
            let sizeInKiloBytes = text.length / 1000;
            list.cachedList = text.trim().split("\n").map(e => e.trim());
            toast.killWithTimeout();
            showToast(`Downloaded list, ${sizeInKiloBytes.toFixed(1)}kB`);
        }
        let regex = new RegExp(input.value, "i");
        let results = list.cachedList.filter(word => regex.test(word));
        output.value = results.join("\n");
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
