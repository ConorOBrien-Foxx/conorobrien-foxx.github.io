
class Block {
    constructor({ options, color, index }) {
        this.options = options;
        this.color = color;
        this.sides = options.length;
        this.index = index;
    }
    
    has(needle) {
        return this.options.includes(needle);
    }
    
    copy() {
        return new Block(this);
    }
}

const increment = (indices, matching, size) => {
    let i = size - 1;
    let carry = 1;
    while(carry) {
        indices[i] += carry;
        if(indices[i] >= matching[i].length) {
            indices[i] = 0;
            carry = 1;
        }
        else {
            carry = 0;
        }
        if(carry && i == 0) {
            return true;
        }
        i--;
    }
    return false;
};

const ADJACENT_COLOR_PENALTY = 5;
const IRREGULAR_COLOR_PENALTY = 15;
const gradeSolution = (bs) => {
    let cost = 0;
    for(let i = 1; i < bs.length; i++) {
        let prev = bs[i - 1];
        let cur = bs[i];
        if(prev.color === cur.color) {
            cost += ADJACENT_COLOR_PENALTY;
        }
        if(cur.color === "~") {
            cost += IRREGULAR_COLOR_PENALTY;
        }
    }
    return cost;
};

const arrangeBlocks = (bs, input, limit) => {
    if(input.length > bs.length) {
        // "Insufficient blocks to phrase the word '%s'\n, returning.", input
        console.log("Insufficient blocks to phrase the word, returning", input);
        return;
    }
    
    let matchingBlocks = [...input].map(cur => 
        bs.filter(block => block.has(cur))
    );
    
    let couldNotFind = matchingBlocks.filter(bs => bs.length === 0);
    if(couldNotFind.length > 0) {
        console.log("No blocks containing:", couldNotFind);
        return;
    }
    
    console.log("Searching all solutions...");
    console.log("limit =", limit);
    
    const iterate = Array(input.length).fill(0);
    // const indices = Array(input.length);
    let indices;
    
    let isValid;
    let validSolutions = [];
    do {
        isValid = true;
        indices = matchingBlocks.map((bs, i) => bs[iterate[i]].index);
        isValid = new Set(indices).size === indices.length;
        // console.log(iterate);
        // console.log(indices);
        if(isValid) {
            // console.log(indices);
            let currentSolution = indices.map(idx => bs[idx]);
            validSolutions.push(currentSolution);
        }
    }
    while(!increment(iterate, matchingBlocks, input.length));
    
    validSolutions.sort((a, b) => gradeSolution(a) - gradeSolution(b));
    
    validSolutions
        .slice(0, limit)
        .forEach(solution => {
            // console.log(solution);
            let display = [];
            solution.forEach((block, idx) => {
                display.push(block.options.join(" ").replace(input[idx], "[$&]"));
                // console.log(block.options);
            });
            console.log(display);
        });
    
};

const EXAMPLE_BLOCKS = `R AIRRE9
G AEEHE2
B HETT.T
G AADR.N
Y OPYY5.
R LARP3M
G CPRP4Y
G 7EAHB.
R MYC6V.
B SRLFEI
Y WHM1B.
Y SESY..
R NEMD.I
Y TISSN.
~ AUPG..`;
let bs = EXAMPLE_BLOCKS.trim().split("\n").map((line, index) => {
    let [ color, [...options] ] = line.split(" ");
    // console.log(color, options);
    console.log(line, index);
    return new Block({ options, color, index });
});
console.log(arrangeBlocks(bs, "HAPPY", 12));