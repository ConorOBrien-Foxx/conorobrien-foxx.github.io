registerApps(".space-transfer-app", app => {
    const template = app.querySelector(".template");
    const copy = app.querySelector(".copy");
    const output = app.querySelector(".output");
    
    let existingToast = null;
    
    const updateOutput = () => {
        let idx = 0;
        const copyTarget = copy.value.replace(/\s/g, "");
        
        output.value = template.value.replace(/\S/g, () =>
            copyTarget[idx++] ?? "");
        
        let nextMessage;
        
        if(idx !== copyTarget.length) {
            const deficit = copyTarget.length - idx;
            
            const deficitDisplay = Math.abs(deficit);
            
            nextMessage = `Note: ${deficitDisplay} character${deficitDisplay === 1 ? "" : "s"} ${deficit > 0 ? "leftover" : "short"}`;
        }
        else if(existingToast) {
            nextMessage = `Numbers match!`;
        }
        
        if(existingToast) {
            existingToast.kill();
        }
        
        if(nextMessage) {
            existingToast = new Toast(nextMessage);
            existingToast.show();
        }
    };
    
    [ template, copy, output ].forEach(el =>
        el.addEventListener("input", updateOutput)
    );
    
    updateOutput();
});
