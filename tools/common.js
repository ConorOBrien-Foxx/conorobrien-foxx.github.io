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
