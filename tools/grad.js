// yeah, this shouldn't use magic constants
// don't really care tbh, just read the comments :)
const colorsToGgp = (colors, generationMode) => {
    // generationMode: personal config
    // 0 = continuous
    // 1 = discrete
    
    colors = colors
        .map(hex => hex.slice(1).match(/../g).map(part => parseInt(part, 16)))
        .map(([r, g, b, a]) => [r / 255.0, g / 255.0, b / 255.0, a ?? 1]);

    const blendingMode = 0;
    // 0 = "linear"
    // 1 = "curved"
    // 2 = "sinusoidal"
    // 3 = "spherical (increasing)"
    // 4 = "spherical (decreasing)"
    // 5 = "step"

    const coloringType = 0;
    // 0 = "RGB"
    // 1 = "HSV CCW"
    // 2 = "HSV CW"

    let resultString = "GIMP Gradient\nName: generated gradient #1\n";

    if (generationMode === 0) {
        const segmentCount = colors.length - 1;
        const coordinates = Array.from({
            length: segmentCount + 1
        }, (_, i) => i / segmentCount);
        const segments = colors.slice(0, -1)
            .map((c1, i) => {
                const left = coordinates[i];
                const right = coordinates[i + 1];
                const mid = (left + right) / 2;
                return [
                    left, mid, right,
                    ...c1,
                    ...colors[i + 1],
                    blendingMode,
                    coloringType,
                    0, 0, // change if you want an endpoint to use fg/bg
                ];
            });
        resultString += segmentCount + "\n";
        resultString += segments.map(seg => seg.join(" ")).join("\n");
    } else if (generationMode === 1) {
        const segmentCount = colors.length;
        const coordinates = Array.from({
            length: segmentCount + 1
        }, (_, i) => i / segmentCount);
        const segments = colors.map((c, i) => {
            const left = coordinates[i];
            const right = coordinates[i + 1];
            const mid = (left + right) / 2;
            return [
                left, mid, right,
                ...c,
                ...c,
                blendingMode,
                coloringType,
                0, 0, // change if you want an endpoint to use fg/bg
            ];
        });
        resultString += segmentCount + "\n";
        resultString += segments.map(seg => seg.join(" ").replace(/\.0/g, "")).join("\n");
    }
    return resultString;
};

window.addEventListener("load", function () {
    // TODO: presets
    for(let app of document.querySelectorAll(".gimp-grad-app")) {
        const updateOutput = () => {
            const colors = [...app.querySelectorAll("input[type=color]")]
                .map(input => input.value);
            const isDiscrete = app.querySelector(".discrete-input").checked;
            const generationMode = isDiscrete ? 1 : 0;
            
            
            let backgroundStyle;
            if(colors.length === 1) {
                backgroundStyle = colors[0];
            }
            else if(isDiscrete) {
                const percentages = Array.from({ length: colors.length + 1 }, (_, i) => i / colors.length * 100);
                const colorsWithStops = colors.flatMap((color, idx) => [
                    `${color} ${percentages[idx]}%`,
                    `${color} ${percentages[idx + 1]}%`,
                ]);
                backgroundStyle = `linear-gradient(to right, ${colorsWithStops.join(", ")})`;
            }
            else {
                const displayColors = colors.length === 1 ? colors.concat(colors) : colors;
                backgroundStyle = `linear-gradient(to right, ${colors.join(", ")})`;
            }
            app.querySelector(".sample-output").style.background = backgroundStyle;
            
            const ggrOutput = app.querySelector(".ggr-output");
            ggrOutput.value = colorsToGgp(colors, generationMode);
            ggrOutput.style.height = "auto";
            ggrOutput.style.height = ggrOutput.scrollHeight + "px";
        };
        
        const syncChangesBetween = function (ev) {
            // sync changes between text and color inputs
            const friends = ev.target.closest(".color-input")
                .querySelectorAll(`input:not([type=${ev.target.type}])`);
            for(let friend of friends) {
                friend.value = ev.target.value;
            }
            updateOutput();
        };
        
        const attachInputListenersWithin = parent => {
            for(let input of parent.querySelectorAll("input")) {
                input.addEventListener("input", syncChangesBetween);
            }
        };
        
        app.querySelector(".discrete-input").addEventListener("input", ev => {
            updateOutput();
        });
        
        app.addEventListener("click", ev => {
            const container = app.querySelector(".color-input-container");
            const colorInputs = container.querySelectorAll(".color-input");
            const closest = ev.target.closest(".color-input");
            const myIndex = [...container.children].indexOf(closest);
            
            if(ev.target.classList.contains("remove-color")) {
                const container = app.querySelector(".color-input-container");
                if(colorInputs.length > 1) {
                    container.removeChild(colorInputs[myIndex]);
                }
                updateOutput();
            }
            else if(ev.target.classList.contains("add-color")) {
                const newColorInput = document.createElement("div");
                newColorInput.className = "color-input";
                const randomColor = "#" + ((0x1000000 + Math.random() * 0xFFFFFF | 0) & 0xFFFFFF).toString(16);
                
                newColorInput.innerHTML = `
                    <input type="text" class="short mono" value="${randomColor}">
                    <input type="color" value="${randomColor}">
                    <button class="symbol remove-color">-</button>
                    <button class="symbol add-color">+</button>
                `;
                attachInputListenersWithin(newColorInput);
                container.insertBefore(newColorInput, colorInputs[myIndex].nextSibling);
                newColorInput.scrollIntoView({ behavior: "instant", block: "nearest" });
                updateOutput();
            }
        });
        attachInputListenersWithin(app.querySelector(".color-input-container"));
        updateOutput();
        // TODO: download as .ggr
    }
});
