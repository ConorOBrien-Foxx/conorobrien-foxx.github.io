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
