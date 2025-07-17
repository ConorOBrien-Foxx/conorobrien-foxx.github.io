const binomial = (n, r) => math.combinations(n, r);

const BIG_ONE = math.bignumber(1);
const probabilityAt = (p, n, x) =>
    // binomial(n, x) * p ** x * (1 - p) ** (n - x);
    math.multiply(
        binomial(n, x),
        math.pow(p, x),
        math.pow(math.subtract(BIG_ONE, p), math.subtract(n, x))
    );

const binomialProbabilities = (p, n, x) => {
    p = math.bignumber(p);
    n = math.bignumber(n);
    x = math.bignumber(x);
    let cumulative = math.bignumber(0);
    
    for(let i = 0; i < x; i++) {
        cumulative = math.add(cumulative, probabilityAt(p, n, i));
    }
    let exact = probabilityAt(p, n, x);
    
    let result = {
        cumulativeLess: cumulative,
        exact: exact,
    };
    result.cumulativeLessEqual = math.add(result.cumulativeLess, result.exact);
    result.cumulativeGreater = math.subtract(BIG_ONE, result.cumulativeLessEqual);
    result.cumulativeGreaterEqual = math.subtract(BIG_ONE, result.cumulativeLess);
    
    return result;
}

const parseInput = str => {
    if(str.indexOf("/") !== -1) {
        // i don't care if there's more parts tbh that's on you
        let [ num, den ] = str.split("/");
        return math.divide(math.bignumber(num), math.bignumber(den));
    }
    let floatValue = parseFloat(str);
    if(str.endsWith("%")) {
        floatValue /= 100;
    }
    return floatValue;
};
// const formatFloat = f => Math.round(f * 1000) / 1000;
// const formatFloat = f => f.toFixed(5).replace(/\.?0+$/, "");
const formatFloat = (f, asPercent = false) => {
    if(asPercent) {
        return math.format(math.multiply(f, 100), { notation: "fixed", precision: 2 })
            // .replace(/\.?0+$/, "")
            + "%";
    }
    else {
        return math.format(f, { notation: "fixed", precision: 5 })
            // .replace(/\.?0+$/, "")
            ;
    }
};

registerApps(".binom-app", app => {
    let pInput = app.querySelector("input.trial");
    let nInput = app.querySelector("input.number");
    let xInput = app.querySelector("input.successes");
    let submitButton = app.querySelector("button.submit");
    let clearButton = app.querySelector("button.clear");
    let configPercent = app.querySelector("input.format-percent");
    
    for(let output of app.querySelectorAll(".output")) {
        output.value = "";
    }
    
    // TODO: highlight elements causing/related to errors
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
        if(x < 0) {
            silent || showPopup("Error: x too small", "Expected x to be a non-negative integer.");
            return false;
        }
        if(x != Math.floor(x)) {
            silent || showPopup("Error: non-integer x", "Expected x to be a non-negative integer.");
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
    
    
    // i seem to remember return true/false corresponds to state changes in the HTML system, so use anonymous lambdas with no return values instead of e.g. pInput.addEventListener("change", validateP);
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
    
    const updateOutput = (silent = false) => {
        if(!pInput.value || !nInput.value || !xInput.value) {
            // invalid: empty
            silent || showPopup("Error: Some entries empty", "Please double check you entered values for p, n, and x.");
            return false;
        }
        
        if(!validateP() || !validateN() || !validateX()) {
            // invalid value
            return false;
        }
        
        let p = parseInput(pInput.value);
        let n = parseInput(nInput.value);
        let x = parseInput(xInput.value);
        
        let formatAsPercent = configPercent.checked;
        
        let result = binomialProbabilities(p, n, x);
        for(let [ key, value ] of Object.entries(result)) {
            let output = app.querySelector(`input.${key}`);
            let indicator = app.querySelector(`.indicator-holder.${key}`);
            // console.log(output, indicator);
            output.value = formatFloat(value, formatAsPercent);
            indicator && updateIndicator(indicator, {
                min: 0,
                value,
                max: 1,
            });
        }
        
        return true;
    }
    
    for(let input of [ pInput, nInput, xInput ]) {
        input.addEventListener("keydown", function (ev) {
            if(ev.key === "Enter" && !ev.ctrlKey) {
                updateOutput();
            }
        });
    }
    submitButton.addEventListener("click", () => {
        updateOutput();
    });
    configPercent.addEventListener("change", () => {
        updateOutput(true);
    });
    
    typesetX(true);
    updateOutput(true);
});