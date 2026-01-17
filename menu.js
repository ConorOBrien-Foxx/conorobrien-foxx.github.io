window.addEventListener("load", () => {
    for(let navButton of document.querySelectorAll("button.nav")) {
        let nav = navButton.parentNode.querySelector("nav");
        if(!nav) {
            console.error("Expected a <nav> sibling for nav button", navButton);
            continue;
        }
        let isShowing = false;
        let animationDuration = 100; // ms
        navButton.addEventListener("click", () => {
            navButton.classList.toggle("open");
            if(isShowing) {
                nav.animate([
                    { opacity: 1 },
                    { opacity: 0 },
                ], animationDuration).finished.then(() => {
                    nav.classList.remove("shown");
                });
            }
            else {
                nav.classList.add("shown");
                nav.animate([
                    { opacity: 0 },
                    { opacity: 1 },
                ], animationDuration);
            }
            
            isShowing = !isShowing;
        });
    }
});
