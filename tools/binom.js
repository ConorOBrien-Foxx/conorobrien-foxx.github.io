const factorialCache = {};
const factorial = n =>
    n <= 1
        ? 1
        : (factorialCache[n] ??= n * factorial(n - 1));

const binomial = (n, r) =>
    factorial(n) / (factorial(r) * factorial(n - r));

const probabilityAt = (p, n, x) =>
    binomial(n, x) * p ** x * (1 - p) ** (n - x);

const binomialProbabilities = (p, n, x) => {
    let cumulative = 0;
    for(let i = 0; i < x; i++) {
        cumulative += probabilityAt(p, n, i);
    }
    let exact = probabilityAt(p, n, x);
    
    let result = {
        cumulativeLess: cumulative,
        exact: exact,
    };
    result.cumulativeLessEqual = result.cumulativeLess + result.exact;
    result.cumulativeGreater = 1 - result.cumulativeLessEqual;
    result.cumulativeGreaterEqual = 1 - result.cumulativeLess;
    
    return result;
}

const parseInput = str => parseFloat(str, 10);
// const formatFloat = f => Math.round(f * 1000) / 1000;
const formatFloat = f => f.toFixed(3).replace(/\.?0+$/, "");

registerApps(".binom-app", app => {
    let pInput = app.querySelector("input.trial");
    let nInput = app.querySelector("input.number");
    let xInput = app.querySelector("input.successes");
    let submitButton = app.querySelector("button.submit");
    let clearButton = app.querySelector("button.clear");
    
    // TODO: allow for input like "100%"
    // TODO: highlight elements causing/related to errors
    // TODO: allow for large inputs e.g. p=0.3333, n=1515, x=500
    const validateP = (silent = false) => {
        let p = parseInput(pInput.value);
        if(p < 0) {
            silent || showPopup("Error: p too small", "Expected p to be a probability in decimal form between 0 and 1, inclusive.");
            return false;
        }
        if(p > 1) {
            silent || showPopup("Error: p too big", "Expected p to be a probability in decimal form between 0 and 1, inclusive.");
            return false;
        }
        return true;
    };
    const validateN = (silent = false) => {
        let n = parseInput(nInput.value);
        if(n <= 0) {
            silent || showPopup("Error: n too small", "Expected n to be a positive integer.");
            return false;
        }
        if(n != Math.floor(n)) {
            silent || showPopup("Error: non-integer n", "Expected n to be a positive integer.");
            return false;
        }
        if(xInput.value) {
            let x = parseInput(xInput.value);
            if(n < x) {
                silent || showPopup("Error: x > n", "Expected n to be greater than or equal to x.");
                return false;
            }
        }
        return true;
    };
    const validateX = (silent = false) => {
        let x = parseInput(xInput.value);
        if(x <= 0) {
            silent || showPopup("Error: x too small", "Expected x to be a positive integer.");
            return false;
        }
        if(x != Math.floor(x)) {
            silent || showPopup("Error: non-integer x", "Expected x to be a positive integer.");
            return false;
        }
        if(nInput.value) {
            let n = parseInput(nInput.value);
            if(n < x) {
                silent || showPopup("Error: x > n", "Expected x to be less than or equal to n.");
                return false;
            }
        }
        return true;
    };
    const typesetX = (silent = false) => {
        if(!validateX(silent)) return;
        let x = parseInput(xInput.value);
        MathJax.typesetPromise().then(() => {
            app.querySelector(".displayExact").textContent = String.raw`\(P(X=${x})\)`;
            app.querySelector(".displayCumulativeLess").textContent = String.raw`\(P(X\lt ${x})\)`;
            app.querySelector(".displayCumulativeLessEqual").textContent = String.raw`\(P(X\le ${x})\)`;
            app.querySelector(".displayCumulativeGreater").textContent = String.raw`\(P(X\gt ${x})\)`;
            app.querySelector(".displayCumulativeGreaterEqual").textContent = String.raw`\(P(X\ge ${x})\)`;
            MathJax.typesetPromise();
        }).catch((err) => console.log(err.message));
    };
    
    
    // i seem to remember return true/false corresponds to state changes in the HTML system
    pInput.addEventListener("change", () => {
        validateP();
    });
    nInput.addEventListener("change", () => {
        validateN();
    });
    xInput.addEventListener("change", () => {
        // validates first
        typesetX();
    });
    
    clearButton.addEventListener("click", function () {
        for(let input of app.querySelectorAll("input")) {
            input.value = "";
        }
    });
    
    submitButton.addEventListener("click", function () {
        if(!pInput.value || !nInput.value || !xInput.value) {
            // invalid: empty
            showPopup("Error: Some entries empty", "Please double check you entered values for p, n, and x.");
            return;
        }
        
        if(!validateP() || !validateN() || !validateX()) {
            // invalid value
            return;
        }
        
        let p = parseInput(pInput.value);
        let n = parseInput(nInput.value);
        let x = parseInput(xInput.value);
        
        let result = binomialProbabilities(p, n, x);
        for(let [ key, value ] of Object.entries(result)) {
            let output = app.querySelector(`input.${key}`);
            output.value = formatFloat(value);
        }
    });
    
    typesetX(true);
});