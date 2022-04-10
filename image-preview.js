const clearChildren = (el) => {
    while(el.firstChild) {
        el.removeChild(el.firstChild);
    }
};

window.addEventListener("load", function () {
    // create the popup dynamically
    const popupBackground = document.createElement("div");
    const popup = document.createElement("div");
    const popupBar = document.createElement("div");
    const popupContent = document.createElement("div");
    
    popupBackground.id = "popup-background";
    popupBackground.classList.add("hidden");
    popup.id = "popup";
    popupBar.id = "popup-bar";
    popupBar.textContent = "x";
    popupContent.id = "popup-content";
    
    popup.appendChild(popupBar);
    popup.appendChild(popupContent);
    popupBackground.appendChild(popup);
    document.body.insertBefore(popupBackground, document.body.firstChild);
    
    const hidePopup = () => {
        popupBackground.classList.add("hidden");
    };
    
    popupBar.addEventListener("click", hidePopup);
    document.addEventListener("keydown", function (ev) {
        if(ev.key === "Escape") hidePopup();
    });
    
    popupBackground.addEventListener("click", function (ev) {
        if(ev.target === popupBackground) {
            hidePopup();
        }
    });
    
    for(let img of document.querySelectorAll("img.preview")) {
        img.addEventListener("click", function () {
            popupBackground.classList.remove("hidden");
            // create content
            clearChildren(popupContent);
            let largeImage = document.createElement("img");
            largeImage.src = img.src;
            largeImage.classList.add("display");
            popupContent.appendChild(largeImage);
        });
    }
});
