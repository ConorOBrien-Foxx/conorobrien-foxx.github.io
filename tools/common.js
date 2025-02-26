const showPopup = (title, content, popupElement = null, popupBackgroundElement = null) => {
    popupElement ??= document.getElementById("popup");
    popupBackgroundElement ??= document.getElementById("popup-background");
    popupBackgroundElement.style.display = "block";
    popupElement.style.display = "block";
    popupElement.querySelector(".popup-title").textContent = title;
    popupElement.querySelector(".popup-content p").textContent = content;
};

const hidePopup = (popupElement = null, popupBackgroundElement = null) => {
    popupElement ??= document.getElementById("popup");
    popupBackgroundElement ??= document.getElementById("popup-background");
    popupBackgroundElement.style.display = "none";
    popupElement.style.display = "none";
};

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
        this.useTimeout = options.useTimeout ?? true; // ms
        this.killed = false;
        this.resolve = null;
        
        this.toastElement = document.createElement("div");
        this.toastElement.textContent = message;
        this.toastElement.classList.add("toast");
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
            this.container.appendChild(this.toastElement);
            
            if(this.useTimeout) {
                this.killWithTimeout().then(value => {
                    this.showResolve = null;
                    resolve(value);
                });
            }
        });
    }
}
// resolve(true) - toast decayed naturally
// resolve(false) - toast was dismissed
const showToast = (message, options = {}) => new Toast(message, options).show();
