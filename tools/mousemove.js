const Messages = {
    RequestHover: "(Hover over)",
    IsMoving: "Moving? ✅",
    IsNotMoving: "Moving? ❌",
};

/*
const DisplayDateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
};
*/

window.addEventListener("load", function () {
    for(let app of document.querySelectorAll(".mouse-move-app")) {
        const box = app.querySelector(".interact-box");
        const notice = box.querySelector(".notice");
        const messages = app.querySelector(".messages");
        const inputs = app.querySelector(".input-holder");
        const pollRateInput = inputs.querySelector(".poll-rate");
        const machineReadableInput = inputs.querySelector(".machine-readable");
        const boxState = {
            app,
            box,
            notice,
            messages,
            running: false,
            lastX: null, lastY: null,
            nextX: null, nextY: null,
            timeouts: [],
            // user inputs
            frequency: 50,
            machineReadable: false,
            now() {
                return new Date(Date.now());
            },
            displayDate(date) {
                return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`
            },
            setNotice(message) {
                this.notice.textContent = message;
            },
            addMessage(message) {
                const messageElement = document.createElement("div");
                messageElement.textContent = message;
                this.messages.appendChild(messageElement);
                this.messages.scrollTop = this.messages.scrollHeight;
            },
            messageMouseMoving() {
                let delta = this.lastMoveStart - this.lastPause;
                if(this.machineReadable) {
                    this.addMessage(`1,${+this.lastMoveStart},${delta},Mouse Unpause`);
                }
                else {
                    this.addMessage(`Mouse started again at ${this.displayDate(this.lastMoveStart)} after ${delta}ms`);
                }
            },
            setMoving() {
                if(this.box.classList.contains("moving")) {
                    return;
                }
                this.box.classList.add("moving");
                this.box.classList.remove("stopped");
                this.setNotice(Messages.IsMoving);
                this.lastMoveStart = this.now();
                this.messageMouseMoving();
            },
            messageMousePaused() {
                let delta = this.lastPause - this.lastMoveStart;
                if(this.machineReadable) {
                    this.addMessage(`2,${+this.lastPause},${delta},Mouse Pause`);
                }
                else {
                    this.addMessage(`Mouse paused at ${this.displayDate(this.lastPause)} after ${delta}ms`);
                }
            },
            setStopped() {
                if(this.box.classList.contains("stopped")) {
                    return;
                }
                this.box.classList.remove("moving");
                this.box.classList.add("stopped");
                this.setNotice(Messages.IsNotMoving);
                this.lastPause = this.now();
                this.messageMousePaused();
            },
            setTimeout(fn, delay) {
                let myIndex = this.timeouts.findIndex(e => e === null);
                if(myIndex < 0) {
                    myIndex = this.timeouts.length;
                }
                this.timeouts[myIndex] = setTimeout(() => {
                    fn.call(this);
                    this.timeouts[myIndex] = null;
                }, delay);
            },
            clearTimeouts() {
                this.timeouts.splice(0).forEach(clearTimeout);
            },
            messageStartRecording() {
                if(this.machineReadable) {
                    // header
                    this.addMessage("-- BEGIN MACHINE READABLE TRANSMISSION (CSV) --");
                    this.addMessage("EventCode,TimeStamp,Delta,Comment");
                    this.addMessage(`0,${+this.lastMoveStart},,Recording Started`);
                }
                else {
                    this.addMessage(`Started recording at ${this.displayDate(this.lastMoveStart)}`);
                }
            },
            deployTimer(startX, startY) {
                // sync inputs
                this.frequency = parseInt(pollRateInput.value, 10); // in ms
                this.machineReadable = machineReadableInput.checked;
                // initialize display
                this.box.classList.add("moving");
                this.setNotice(Messages.IsMoving);
                // initialize object
                this.running = true;
                this.lastX = startX;
                this.lastY = startY;
                this.lastMoveStart = this.now();
                this.messageStartRecording();
                this.setTimeout(this.checkTimer, this.frequency);
            },
            checkTimer() {
                if(this.lastX !== this.nextX || this.lastY !== this.nextY) {
                    // we're good
                    this.setMoving();
                    this.lastX = this.nextX;
                    this.lastY = this.nextY;
                }
                else {
                    this.setStopped();
                }
                this.setTimeout(this.checkTimer, this.frequency);
            },
            signalMove(nextX, nextY) {
                this.nextX = nextX;
                this.nextY = nextY;
            },
            messageStopRecording() {
                let now = this.now();
                if(this.machineReadable) {
                    this.addMessage(`3,${+now},,Recording Stopped`);
                    this.addMessage("-- END MACHINE READABLE TRANSMISSION (CSV) --");
                }
                else {
                    this.addMessage(`Stopped recording at ${this.displayDate(now)}`);
                }
            },
            cancelTimer() {
                this.running = false;
                this.lastX = this.lastY = null;
                // trigger last delta
                this.setStopped();
                this.box.classList.remove("moving");
                this.box.classList.remove("stopped");
                this.setNotice(Messages.RequestHover);
                this.clearTimeouts();
                this.messageStopRecording();
            },
            initialize() {
                this.box.addEventListener("mouseenter", ev => {
                    this.deployTimer(ev.x, ev.y);
                });
                this.box.addEventListener("mouseleave", ev => {
                    this.cancelTimer();
                });
                this.box.addEventListener("mousemove", ev => {
                    this.signalMove(ev.x, ev.y);
                });
            },
        };
        boxState.initialize();
        window.boxState = boxState;
    }
});
