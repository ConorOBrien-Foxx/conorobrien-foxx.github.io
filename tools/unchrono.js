const parseStopwatchTiming = timing => {
    // [[[DD]:HH]:MM]:SS
    // null if cannot parse, rather than error
    let parts = timing.split(/:|\./).map(n => parseInt(n, 10));
    
    let durationSpecifier = {};
    
    // could obviously be something like [ d, h, m, s ] = [ 0, 0, 0, ...parts ].slice(-4)
    // but this is easier to maintain in case i want different formats
    console.log(parts);
    if(parts.length === 4) {
        [
            durationSpecifier.days,
            durationSpecifier.hours,
            durationSpecifier.minutes,
            durationSpecifier.seconds
        ] = parts;
    }
    else if(parts.length === 3) {
        [
            durationSpecifier.hours,
            durationSpecifier.minutes,
            durationSpecifier.seconds
        ] = parts;
    }
    else if(parts.length === 2) {
        [
            durationSpecifier.minutes,
            durationSpecifier.seconds
        ] = parts;
    }
    else if(parts.length === 1) {
        [
            durationSpecifier.seconds
        ] = parts;
    }
    
    if(Object.keys(durationSpecifier).length === 0) {
        return null;
    }
    
    try {
        return Temporal.Duration.from(durationSpecifier).round({ largestUnit: "days" });
    }
    catch {
        return null;
    }
};

const parseDateTime = endTime => {
    // YYYY-MM-DD [@] HH:MM:SS
    // null if cannot parse, rather than error
    let parts = endTime.split(/\s+(?:@\s*)?/);
    if(parts.length !== 2) {
        return null;
    }
    let [ date, time ] = parts;
    let dateParts = date.split("-");
    if(dateParts.length !== 3) {
        return null;
    }
    let [ year, month, day ] = dateParts;
    let timeParts = time.split(":");
    if(timeParts.length !== 3) {
        return null;
    }
    let [ hour, minute, second ] = timeParts;
    try {
        return Temporal.PlainDateTime.from({
            year, month, day, hour, minute, second
        });
    }
    catch {
        return null;
    }
};

const padLeadingZero = (n, amt) =>
    n.toString().padStart(amt, "0");

const dateToString = date =>
    `${date.year}-${padLeadingZero(date.month, 2)}-${padLeadingZero(date.day, 2)}`;

const timeToString = time =>
    `${padLeadingZero(time.hour, 2)}:${padLeadingZero(time.minute, 2)}:${padLeadingZero(time.second, 2)}`;

const dateTimeToString = dateTime =>
    `${dateToString(dateTime)} ${timeToString(dateTime)}`;
    
const durationToString = duration => {
    let rounded = duration.round({ largestUnit: "hours" });
    return `${padLeadingZero(rounded.hours, 2)}:${padLeadingZero(rounded.minutes, 2)}:${padLeadingZero(rounded.seconds, 2)}`;
    /*
    let rounded = duration.round({ largestUnit: "days" });
    return `${padLeadingZero(rounded.days, 3)}:${padLeadingZero(rounded.hours, 2)}:${padLeadingZero(rounded.minutes, 2)}:${padLeadingZero(rounded.seconds, 2)}`
        // .replace(/^(0+:)+/, "")
        // .replace(/^00$/, "0")
    ;
    */
};

const unchrono = (stopwatchDurations, finalDateTime) => {
    stopwatchDurations.reverse();
    let runningTime = finalDateTime;
    let times = [ runningTime ];
    for(let duration of stopwatchDurations) {
        runningTime = runningTime.subtract(duration);
        times.push(runningTime);
    }
    times.reverse();
    return times;
};

registerApps(".unchrono-app", app => {
    let howToUse = app.querySelector(".how-to-use");
    
    if(typeof Temporal === "undefined") {
        howToUse.open = true;
        showPopup("Temporal not found", "Your browser does not support the Temporal API. Read 'How to Use' for more information.");
        return;
    }
    
    let wallClockReading = app.querySelector(".wall-clock");
    let chronoReadings = app.querySelector(".chrono-readings");
    let resultTimes = app.querySelector(".result-times");
    let setNowButton = app.querySelector(".set-now");
    let submitButton = app.querySelector(".submit");
    let clearButton = app.querySelector(".clear");
    
    const submit = () => {
        let endTime = parseDateTime(wallClockReading.value);
        // TODO: more specific error reporting
        if(endTime === null) {
            showPopup("Invalid input", `Could not convert wall clock ${wallClockReading.value} to a datetime. Read 'How to Use' for more information.`);
            return;
        }
        
        // let stopwatchTimings = chronoReadings.value.split(/[,\s]+/);
        let stopwatchTimings = chronoReadings.value.match(/\d+(?::\d+)*/g);
        console.log(stopwatchTimings);
        let convertedStopwatchTimings = stopwatchTimings.map(parseStopwatchTiming);
        
        // TODO: more specific error reporting, including reporting *all* rather than *first* null
        let nullIndex = convertedStopwatchTimings.indexOf(null);
        if(nullIndex !== -1) {
            howToUse.open = true;
            showPopup("Invalid input", `Could not convert stopwatch time ${stopwatchTimings[nullIndex]} to a duration. Read 'How to Use' for more information.`);
            return;
        }
        
        let times = unchrono(convertedStopwatchTimings, endTime);
        
        let allDatesOccurOnSomeDate = times.every(time => Temporal.PlainDate.compare(time, times[0]) === 0);
        let stringTimes = allDatesOccurOnSomeDate ? times.map(timeToString) : times.map(dateTimeToString);
        
        let sectionSplitIndex = 0;
        // only include if we decide to use days in representation
        /*
        if(convertedStopwatchTimings.every(sr => sr.days === 0)) {
            sectionSplitIndex++;
        }
        */
        if(convertedStopwatchTimings.every(sr => sr.hours === 0)) {
            sectionSplitIndex++;
        }
        if(convertedStopwatchTimings.every(sr => sr.minutes === 0)) {
            sectionSplitIndex++;
        }
        let stopwatchRepresentations = convertedStopwatchTimings
            .toReversed()
            .map(durationToString)
            .map(sr => sr.split(":").slice(sectionSplitIndex).join(":"));
        
        resultTimes.value = stringTimes.map((str, idx) =>
            str + (stopwatchRepresentations[idx - 1] ? `\t+${stopwatchRepresentations[idx - 1]}` : "\tstart")
        ).join("\n");
        
        resizeTextareaToContent(resultTimes);
    };
    
    chronoReadings.addEventListener("input", () => resizeTextareaToContent(chronoReadings));
    wallClockReading.addEventListener("keydown", ev => ev.key === "Enter" && submit());
    chronoReadings.addEventListener("keydown", ev => ev.ctrlKey && ev.key === "Enter" && submit());
    
    submitButton.addEventListener("click", submit);
    
    clearButton.addEventListener("click", () => {
        howToUse.open = false;
        chronoReadings.value = "";
        wallClockReading.value = "";
        resultTimes.value = "";
        resizeTextareaToContent(chronoReadings);
        resizeTextareaToContent(resultTimes);
    });
    
    const setNowValue = () => {
        let now = Temporal.Now.plainDateTimeISO();
        wallClockReading.value = dateTimeToString(now);
    };
    
    // TODO: abstract out into logic in common.js
    let pressAndHoldTimeout = null, setNowUpdateInterval = null;
    setNowButton.addEventListener("mousedown", ev => {
        if(ev.button === 2) {
            // ignore right click
            return;
        }
        if(pressAndHoldTimeout) {
            clearTimeout(pressAndHoldTimeout);
        }
        pressAndHoldTimeout = setTimeout(() => {
            setNowButton.classList.add("depressed");
            setNowValue();
            setNowUpdateInterval = setInterval(() => {
                setNowValue();
            }, 1000);
        }, 500);
    });
    
    const cancelPressAndHold = () => {
        if(!setNowUpdateInterval) {
            return;
        }
        setNowButton.classList.remove("depressed");
        clearInterval(setNowUpdateInterval);
    };
    
    document.body.addEventListener("mouseup", cancelPressAndHold);
    document.body.addEventListener("blur", cancelPressAndHold);
    
    setNowButton.addEventListener("click", () => {
        if(setNowUpdateInterval) {
            // handled by mouseup
            return;
        }
        if(pressAndHoldTimeout) {
            clearTimeout(pressAndHoldTimeout);
        }
        setNowValue();
    });
    
    resizeTextareaToContent(chronoReadings);
    resizeTextareaToContent(resultTimes);
});
