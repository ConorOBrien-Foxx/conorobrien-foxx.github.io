const showPopup = (title, content, popupElement = null, popupBackgroundElement = null) => {
    popupElement ??= document.getElementById("popup");
    popupBackgroundElement ??= document.getElementById("popup-background");
    popupBackgroundElement.style.display = "block";
    popupElement.style.display = "block";
    popupElement.querySelector(".popup-title").textContent = title;
    let contentElement = popupElement.querySelector(".popup-content p");
    if(typeof content === "string") {
        contentElement.textContent = content;
    }
    else {
        clearChildren(contentElement);
        contentElement.appendChild(content);
    }
};

const hidePopup = (popupElement = null, popupBackgroundElement = null) => {
    popupElement ??= document.getElementById("popup");
    popupBackgroundElement ??= document.getElementById("popup-background");
    popupBackgroundElement.style.display = "none";
    popupElement.style.display = "none";
};

window.addEventListener("load", () => {
    document.body.addEventListener("keydown", ev => {
        if(ev.key === "Escape") {
            hidePopup();
        }
    });
});

const clearChildren = el => {
    while(el.firstChild) {
        el.removeChild(el.firstChild);
    }
};

const registerApps = (klass, cb) => {
    // TODO: check if already loaded
    window.addEventListener("load", function () {
        for(let app of document.querySelectorAll(klass)) {
            cb(app);
        }
    });
};

const resizeTextareaToContent = textarea => {
    textarea.style.height = "auto";
    
    let style = window.getComputedStyle(textarea, null);
    let targetHeight = textarea.scrollHeight;
    // let targetHeight = textarea.getBoundingClientRect().height;
    
    if(style.getPropertyValue("box-sizing") === "border-box") {
        // TODO: do not assume px unit measurements?
        targetHeight += parseFloat(style.getPropertyValue("padding-top"));
        targetHeight += parseFloat(style.getPropertyValue("padding-bottom"));
    }
    
    textarea.style.height = `${targetHeight}px`;
};

class Toast {
    constructor(message, options = {}) {
        this.container = options.container ?? document.querySelector(".toast-container");
        this.cancellable = options.cancellable ?? true;
        this.timeout = options.timeout ?? 3000; // ms
        this.useTimeout = options.useTimeout ?? true;
        this.classes = options.classes ?? [];
        this.killed = false;
        this.resolve = null;
        
        this.toastElement = document.createElement("div");
        this.toastElement.textContent = message;
        this.toastElement.classList.add("toast");
        this.toastElement.classList.add(...this.classes);
        if(this.cancellable) {
            this.toastElement.classList.add("cancellable");
        }
        if(this.cancellable) {
            let cancelButton = document.createElement("span");
            cancelButton.textContent = "X";
            cancelButton.classList.add("cancel-button");
            this.toastElement.appendChild(cancelButton);
            this.toastElement.addEventListener("click", () => {
                this.kill();
            });
        }
    }
    
    kill() {
        return new Promise((resolve, reject) => {
            this.toastElement.classList.remove("showing");
            setTimeout(() => {
                if(this.killed) {
                    this.showResolve?.(false);
                    resolve(false);
                    return;
                }
                this.toastElement.classList.add("killed")
                this.container.removeChild(this.toastElement);
                this.killed = true;
                resolve(true);
                this.showResolve?.(true);
            }, 500);
        });
    }
    
    killWithTimeout() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if(this.killed) {
                    resolve(false);
                    return;
                }
                this.kill().then(resolve);
            }, this.timeout);
        });
    }
    
    show() {
        if(this.showResolve) {
            throw "Cannot show already shown toast";
        }
        return new Promise((resolve, reject) => {
            this.showResolve = resolve;
            this.toastElement.classList.add("showing");
            this.container.prepend(this.toastElement);
            
            if(this.useTimeout) {
                this.killWithTimeout().then(value => {
                    this.showResolve = null;
                    resolve(value);
                });
            }
        });
    }
    
    static statusToast(message, options = {}) {
        return new Toast(message, {
            cancellable: false,
            useTimeout: false,
            timeout: 1000,
            ...options,
        });
    }
    
    static errorToast(message, options = {}) {
        return new Toast(message, {
            cancellable: true,
            useTimeout: false,
            classes: ["error"],
            ...options,
        });
    }
}
// resolve(true) - toast decayed naturally
// resolve(false) - toast was dismissed
const showToast = (message, options = {}) => new Toast(message, options).show();

registerApps(".popout-tray", app => {
    let toggleButton = app.querySelector(".popout-tray-toggle");
    let trayData = app.querySelectorAll(".popout-tray-data");
    toggleButton.addEventListener("click", () => {
        for(let data of trayData) {
            data.classList.toggle("showing");
        }
    });
});

const updateIndicator = (indicator, { min, max, value, offMax, lowMax, mediumMax, highMax }) => {
    let categoryCount = indicator.children.length;
    let remappedValue = (value - min) / (max - min);
    let targetIndex = Math.round(categoryCount * remappedValue);
    console.log(+value, remappedValue, targetIndex);
    for(let child of indicator.children) {
        child.classList.remove("status-on");
    }
    let reverseIndex = indicator.children.length - targetIndex;
    // can exceed, in which case we do not want any on
    indicator.children[reverseIndex]?.classList.add("status-on");
    
    indicator.classList.remove("low");
    indicator.classList.remove("medium");
    indicator.classList.remove("high");
    
    let updatedClass = null;
    
    let lowMaxIndex = Math.round(0.25 * categoryCount);
    let mediumMaxIndex = Math.round(0.50 * categoryCount);
    let highMaxIndex = Math.round(1.00 * categoryCount);
    console.log({lowMaxIndex, mediumMaxIndex, highMaxIndex});
    
    if(targetIndex === 0) {
        // no class
    }
    else if(targetIndex <= lowMaxIndex) {
        updatedClass = "low";
    }
    else if(targetIndex <= mediumMaxIndex) {
        updatedClass = "medium";
    }
    else if(targetIndex <= highMaxIndex) {
        updatedClass = "high";
    }
    
    if(updatedClass) {
        indicator.classList.add(updatedClass);
    }
};

const copyTextToClipboard = target => {
    target.select();
    document.execCommand("copy");
};

const iterateChunked = (array, fn, config) => new Promise((resolve, reject) => {
    config = {
        perChunk: 100,
        chunkDelay: 100, // ms
        ...config,
    };
    let iteration = startIdx => {
        let endIdx = startIdx + config.perChunk;
        let range = array.slice(startIdx, endIdx);
        
        if(range.length === 0) {
            resolve();
            return;
        }
        
        for(let element of range) {
            let result = fn(element);
            if(result === iterateChunked.BREAK) {
                break;
            }
        }
        
        setTimeout(iteration, config.chunkDelay, endIdx);
    };
    
    iteration(0);
});
iterateChunked.BREAK = Symbol("iterateChunked.BREAK");
