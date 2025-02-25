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

const registerApps = (klass, cb) => {
    // TODO: check if already loaded
    window.addEventListener("load", function () {
        for(let app of document.querySelectorAll(klass)) {
            cb(app);
        }
    });
};

// resolve(true) - toast decayed naturally
// resolve(false) - toast was dismissed
const showToast = (message, timeout = 3000, container = null) => new Promise((resolve, reject) => {
    container ??= document.querySelector(".toast-container");
    let toast = document.createElement("div");
    toast.textContent = message;
    toast.classList.add("toast");
    toast.classList.add("showing");
    container.appendChild(toast);
    
    toast.addEventListener("click", function () {
        container.removeChild(toast);
        resolve(false);
        toast = null;
    });
    
    setTimeout(() => {
        if(!toast) {
            return;
        }
        toast.classList.remove("showing");
        setTimeout(() => {
            if(!toast) {
                return;
            }
            container.removeChild(toast);
            resolve(true);
        }, 500);
    }, timeout);
});
