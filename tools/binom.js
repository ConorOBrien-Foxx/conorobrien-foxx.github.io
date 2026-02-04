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
};

const inverseBinomialProbability = (p, pTarget, x) => {
    // there's probably a math way to do this, but i don't know it and my head hurts
    // so newton's method it is
    // TODO: use the actual math solution, there is noticeable lag for extreme cases
    let left = 1;
    let right = 100;
    // find a suitable search bound
    let ceg = null;
    do {
        if(ceg !== null) {
            left = right;
            right *= 2;
        }
        ceg = binomialProbabilities(p, right, x).cumulativeGreaterEqual;
    }
    while(ceg < pTarget);
    while(left < right) {
        let mid = left + Math.floor((right - left) / 2);
        console.log({left,right,mid});
        ceg = +binomialProbabilities(p, mid, x).cumulativeGreaterEqual;
        console.log({ceg, pTarget});
        if(ceg < pTarget) {
            if(left == mid) {
                left = right;
                break;
            }
            left = mid;
        }
        else {
            right = mid;
        }
    }
    console.log(left, right);
    return left;
};

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
    // solve for px
    let pInput = app.querySelector("input.trial");
    let nInput = app.querySelector("input.number");
    let xInput = app.querySelector("input.successes");
    // solve for n
    let targetProbability = app.querySelector("input.target-probability");
    let minimumN = app.querySelector(".minimum-n");
    let achievedProb = app.querySelector(".achieved-probability");
    let achievedProbIndicator = app.querySelector(".achieved-probability-indicator");
    // app globals
    let submitButton = app.querySelector("button.submit");
    let clearButton = app.querySelector("button.clear");
    let configPercent = app.querySelector("input.format-percent");
    
    for(let output of app.querySelectorAll(".output")) {
        output.value = "";
    }
    
    const resetOutput = () => {
        app.querySelectorAll("input.output").forEach(input => input.value = "");
        app.querySelectorAll(".indicator-holder").forEach(indicator =>
            updateIndicator(indicator, { min: 0, value: 0, max: 1 }));
    };
    
    const Solvers = {
        px: {
            cached: {
                p: null,
                n: null,
                x: null,
            },
            typeset(silent) {
                this.typesetX(silent);
            },
            // TODO: highlight elements causing/related to errors
            validateP(silent = false) {
                let p = parseInput(pInput.value);
                if(p < 0) {
                    silent || showPopup(`Error: p too small`, `Expected p to be a probability in decimal form between 0 and 1, inclusive.`);
                    return false;
                }
                if(p > 1) {
                    silent || showPopup(`Error: p too big`, `Expected p to be a probability in decimal form between 0 and 1, inclusive.`);
                    return false;
                }
                return true;
            },
            validateN(silent = false) {
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
            },
            validateX(silent = false) {
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
            },
            typesetX(silent = false) {
                if(!this.validateX(silent)) return;
                let x = parseInput(xInput.value);
                MathJax.typesetPromise().then(() => {
                    app.querySelector(".displayExact").textContent = String.raw`\(P(X=${x})\)`;
                    app.querySelector(".displayCumulativeLess").textContent = String.raw`\(P(X\lt ${x})\)`;
                    app.querySelector(".displayCumulativeLessEqual").textContent = String.raw`\(P(X\le ${x})\)`;
                    app.querySelector(".displayCumulativeGreater").textContent = String.raw`\(P(X\gt ${x})\)`;
                    app.querySelector(".displayCumulativeGreaterEqual").textContent = String.raw`\(P(X\ge ${x})\)`;
                    MathJax.typesetPromise();
                }).catch((err) => console.log(err.message));
            },
            updateOutput(silent = false) {
                if(!pInput.value || !nInput.value || !xInput.value) {
                    // invalid: empty
                    silent || showPopup("Error: Some entries empty", "Please double check you entered values for p, n, and x.");
                    return false;
                }
                
                if(!this.validateP(silent) || !this.validateN(silent) || !this.validateX(silent)) {
                    // invalid value
                    return false;
                }
                
                this.cached.p = pInput.value;
                this.cached.n = nInput.value;
                this.cached.x = xInput.value;
                
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
            },
        },
        n: {
            cached: {
                p: null,
                px: null,
                x: null,
            },
            typeset(silent) {
                this.typesetX(silent);
            },
            typesetX(silent = false) {
                // do nothing
            },
            validateP(silent) {
                return Solvers.px.validateP(silent);
            },
            validateProbability(silent) {
                let p = parseInput(targetProbability.value);
                if(p < 0) {
                    silent || showPopup(`Error: P(X) too small`, `Expected p to be a probability in decimal form between 0 (inclusive) and 1 (exclusive).`);
                    return false;
                }
                if(p > 1) {
                    silent || showPopup(`Error: P(X) too big`, `Expected p to be a probability in decimal form between 0 (inclusive) and 1 (exclusive).`);
                    return false;
                }
                if(p == 1) {
                    silent || showPopup(`Error: P(X) cannot be 1`, `Expected p to be a probability in decimal form between 0 (inclusive) and 1 (exclusive).`);
                    return false;
                }
                return true;
            },
            validateX(silent) {
                return Solvers.px.validateX(silent);
            },
            updateOutput(silent = false) {
                if(!pInput.value || !targetProbability.value || !xInput.value) {
                    // invalid: empty
                    silent || showPopup("Error: Some entries empty", "Please double check you entered values for p, P(X), and x.");
                    return false;
                }
                
                if(!this.validateP(silent) || !this.validateProbability(silent) || !this.validateX(silent)) {
                    // invalid value
                    return false;
                }
                
                this.cached.p = pInput.value;
                this.cached.px = targetProbability.value;
                this.cached.x = xInput.value;
                
                let p = parseInput(pInput.value);
                let pTarget = parseInput(targetProbability.value);
                let x = parseInput(xInput.value);
                
                let formatAsPercent = configPercent.checked;
                
                console.time("inverseBinomialProbability");
                let n = inverseBinomialProbability(p, pTarget, x);
                console.timeEnd("inverseBinomialProbability");
                let ceg = +binomialProbabilities(p, n, x).cumulativeGreaterEqual;
                minimumN.value = n;
                nInput.value = n; // convenience :)
                achievedProb.value = formatFloat(ceg, formatAsPercent);
                updateIndicator(achievedProbIndicator, { min: 0, value: ceg, max: 1 });
            },
        },
        current() {
            return Solvers[getSolveFor().value];
        }
    };
    
    
    // i seem to remember return true/false corresponds to state changes in the HTML system, so use anonymous lambdas with no return values instead of e.g. pInput.addEventListener("change", validateP);
    pInput.addEventListener("change", function () {
        Solvers.current().validateP();
        if(Solvers.current().cached.p !== this.value) {
            resetOutput();
        }
    });
    nInput.addEventListener("change", function () {
        Solvers.current().validateN();
        if(Solvers.current().cached.n !== this.value) {
            resetOutput();
        }
    });
    targetProbability.addEventListener("change", function () {
        Solvers.current().validateProbability();
        if(Solvers.current().cached.px !== this.value) {
            resetOutput();
        }
    });
    xInput.addEventListener("change", function () {
        // validates first
        Solvers.current().typesetX();
        if(Solvers.current().cached.x !== this.value) {
            resetOutput();
        }
    });
    
    let radioButtons = [...document.querySelectorAll("input[name=solve-for]")];
    const getSolveFor = () => radioButtons.find(c => c.checked);
    const onRadioButtonChange = function (ev) {
        let { value } = this;
        document.querySelectorAll(".toggleable-solve-for").forEach(sft => {
            sft.classList.toggle("hidden", !sft.classList.contains(`solve-for-${value}`));
        });
        if(ev !== null) {
            Solvers.current().updateOutput(true);
        }
    };
    radioButtons.forEach(btn => {
        btn.addEventListener("change", onRadioButtonChange);
    });
    onRadioButtonChange.call(getSolveFor(), null);
    
    clearButton.addEventListener("click", function () {
        for(let input of app.querySelectorAll("input")) {
            input.value = "";
        }
    });
    
    for(let input of [ pInput, nInput, targetProbability, xInput ]) {
        input.addEventListener("keydown", function (ev) {
            if(ev.key === "Enter" && !ev.ctrlKey) {
                console.log("render from enter");
                Solvers.current().updateOutput();
            }
        });
    }
    submitButton.addEventListener("click", () => {
        Solvers.current().updateOutput();
    });
    configPercent.addEventListener("change", () => {
        Solvers.current().updateOutput(true);
    });
    
    Solvers.current().typeset(true);
    Solvers.current().updateOutput(true);
});