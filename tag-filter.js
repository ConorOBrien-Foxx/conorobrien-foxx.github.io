window.addEventListener("load", function () {
    const handleActionTagClick = function () {
        this.classList.toggle("selected");
        // TODO: actually filter
    };
    for(let actionTag of document.querySelectorAll(".action.tag")) {
        actionTag.addEventListener("click", handleActionTagClick);
    }
});
