// TODO: add puzzle reset/move navigation

const BASE_CONFIG = {
    draggable: true,
    pieceTheme: "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
    moveSpeed: 200,
};

const SQUARE_CLASS = "square-55d63";

const InteractiveChessboard = (id, cfg) => {
    let playerToMove = cfg.position.split(" ")[1];
    
    let baseElement = document.getElementById(id);
    let parent = baseElement.parentElement;
    let moveOrder = parent.querySelector(".move-order ol");
    let messageHolder = parent.querySelector(".message");
    let config;
    
    const addMoveClasses = span => {
        if(span.textContent.endsWith("!!")) {
            span.className = "brilliant";
        }
        else if(span.textContent.endsWith("!")) {
            span.className = "excellent";
        }
        span.className += " added";
    };
    
    let state = {
        // variables
        playerToMove,
        moveOrder,
        board: null,
        solved: false,
        solutions: cfg.solutions ?? [ cfg.solution ],
        responses: cfg.responses,
        solutionIndex: 0,
        tapMove: null,
        nextMoveDelay: 100, //ms
        marked: [],
        // methods
        getCurrentStep() {
            return this.solutions.map(solution => solution[this.solutionIndex]);
        },
        nextMove(source, target, piece) {
            let li = 
                playerToMove === "w"
                    ? document.createElement("li")
                    : moveOrder.lastElementChild;
            
            this.solutions = this.solutions.filter(solution => {
                let expectedSolution = solution[this.solutionIndex];
                // console.log(expectedSolution);
                let [ expectedSource, expectedTarget, expectedPiece ] = expectedSolution;
                return source === expectedSource && target === expectedTarget && piece === expectedPiece;
            });
            
            let span = document.createElement("span");
            span.textContent = this.getCurrentStep()[0][3];
            addMoveClasses(span);
            li.appendChild(span);
            
            if(playerToMove === "w") {
                moveOrder.appendChild(li);
            }
            
            let hasNextSolutionStep = !!this.solutions[0][this.solutionIndex + 1];
            
            if(this.responses[this.solutionIndex] && hasNextSolutionStep) {
                messageHolder.textContent = "That's it! Keep going!";
            }
            else {
                state.solved = true;
                messageHolder.textContent = "Nice solve!";
                if(cfg.info) {
                    messageHolder.textContent += " " + cfg.info;
                }
            }
            
            let [ move, moveReadable ] = this.responses[this.solutionIndex] ?? [];
            this.solutionIndex++;
            this.updateMarkings();
            
            if(!move) {
                return;
            }
            
            setTimeout(() => {
                if(playerToMove === "b") {
                    li = document.createElement("li");
                    moveOrder.appendChild(li);
                }
                let span = document.createElement("span");
                span.textContent = moveReadable;
                addMoveClasses(span);
                li.appendChild(span);
                let [ whole, justMove, promotion ] = move.match(/^(.+?)(?:=(.))?$/);
                console.log(justMove);
                let pos = this.board.move(justMove);
                if(promotion) {
                    setTimeout(() => {
                        // change to promote
                        let promoteSquare = justMove.split("-")[1];
                        this.board.position(Object.assign({}, pos, {
                            [promoteSquare]: pos[promoteSquare][0] + promotion,
                        }));
                        // TODO: use our move speed instead
                    }, config.moveSpeed);
                }
            }, this.nextMoveDelay);
        },
        setTapMove(source, piece) {
            let [ oldSource, oldPiece ] = this.tapMove ?? [];
            let targetSquare = baseElement.querySelector(`.square-${source}`);
            if(oldSource === source) {
                this.tapMove = null;
                targetSquare.classList.remove("highlight-selected");
            }
            else {
                if(oldSource) {
                    let oldSquare = baseElement.querySelector(`.square-${oldSource}`);
                    oldSquare.classList.remove("highlight-selected");
                }
                this.tapMove = [ source, piece ];
                targetSquare.classList.add("highlight-selected");
            }
            // console.log(source);
        },
        removeTapMove() {
            if(this.tapMove) {
                this.setTapMove(...this.tapMove);
            }
        },
        handleTapEnd(ev) {
            if(!this.tapMove) {
                return;
            }
            let [ source, piece ] = this.tapMove;
            let sourceSquare = baseElement.querySelector(`.square-${source}`);
            sourceSquare.classList.remove("highlight-selected");
            
            let square = ev.target.closest("." + SQUARE_CLASS);
            let target = square.dataset.square;
            
            this.tapMove = null;
            
            this.processMove(source, target, piece, true);
        },
        processMove(source, target, piece, makeMove = false) {
            console.log(source, target, piece);
            let anySolution = this.getCurrentStep().find(expectedSolution => {
                let [ expectedSource, expectedTarget, expectedPiece ] = expectedSolution;
                return source === expectedSource && target === expectedTarget && piece === expectedPiece;
            });
            this.removeTapMove();
            if(anySolution) {
                if(makeMove) {
                    this.board.move(`${source}-${target}`);
                    setTimeout(() => this.nextMove(source, target, piece), config.moveSpeed);
                }
                else {
                    this.nextMove(source, target, piece);
                }
            }
            else {
                messageHolder.textContent = "That's not it.";
                // TODO: give feedback to the user about what went wrong
                return "snapback";
            }
        },
        markCell(target, classes) {
            if(this.marked.some(([ otherTarget, otherClasses ]) => 
                otherTarget === target && otherClasses === classes
            )) {
                // do not duplicate
                return false;
            }
            this.marked.push([ target, classes ]);
            let squareToMark = baseElement.querySelector(`.square-${target}`);
            squareToMark.className += ` highlight-movetype ${classes}`;
            return true;
        },
        clearMarked() {
            this.marked.forEach(([ target, classes ]) => {
                let squareToUnmark = baseElement.querySelector(`.square-${target}`);
                // console.log(squareToUnmark, squareToUnmark.className);
                squareToUnmark.classList.remove("highlight-movetype");
                classes.split(" ").forEach(klass => {
                    squareToUnmark.classList.remove(klass);
                });
            });
            
            this.marked = [];
        },
        updateMarkings() {
            this.clearMarked();
            
            let newMarkings = config.markings?.[this.solutionIndex];
            
            newMarkings?.forEach(([ target, classes ]) => {
                this.markCell(target, classes);
            });
        },
        markHint() {
            if(!this.solutions[0]?.[this.solutionIndex]) {
                return;
            }
            let firstHintGiven = !this.markCell(
                this.solutions[0][this.solutionIndex][0],
                "hint",
            );
            if(firstHintGiven) {
                this.markCell(
                    this.solutions[0][this.solutionIndex][1],
                    "hint",
                );
            }
        },
        reset(originalState) {
            Object.assign(state, originalState);
            state.board = Chessboard(id, config);
            state.updateMarkings();
            moveOrder.querySelectorAll(".added").forEach(el => {
                el.remove();
            });
            moveOrder.querySelectorAll("li").forEach(el => {
                if(!el.children.length) {
                    el.remove();
                }
            });
        },
    };
    
    config = Object.assign({}, BASE_CONFIG, cfg, {
        onDragStart(source, piece, position, orientation) {
            let isValid = !state.solved && piece[0] === state.playerToMove;
            
            if(isValid) {
                state.setTapMove(source, piece);
            }
            
            return isValid;
        },
        onDrop(source, target, piece, newPos, oldPos, orientation) {
            if(source === target) {
                // ignore
                return;
            }
            return state.processMove(source, target, piece);
        },
    });
    state.board = Chessboard(id, config);
    
    baseElement.addEventListener("click", ev => state.handleTapEnd(ev));
    state.updateMarkings();
    
    let originalState = Object.assign({}, state);
    
    let controls = document.createElement("div");
    controls.className = "puzzle-controls";
    
    let resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.addEventListener("click", function () {
        state.reset(originalState);
    });
    
    let hintButton = document.createElement("button");
    hintButton.textContent = "Hint";
    hintButton.addEventListener("click", function () {
        state.markHint();
    });
    
    controls.appendChild(resetButton);
    controls.appendChild(hintButton);
    parent.after(controls);
    
    return state.board;
}

window.addEventListener("load", function () {
    InteractiveChessboard("chess-puzzle-board-1", {
        position: "4kb1B/p1p5/2P1p1p1/1pN2q2/1P3P1p/P7/2P3PP/R2R2K1 w - - 0 21",
        solution: [
            ["c5", "e6", "wN", "Nxe6!!"],
            ["d1", "e1", "wR", "Re1!"],
            ["e1", "e6", "wR", "Rxe6"],
        ],
        responses: [
            ["f5-e6", "Qxe6"],
            ["e8-f7", "Kf7"],
            ["f7-e6", "Kxe6"],
        ],
        markings: [
            [
                [ "e6", "mistake" ],
            ],
            [
                [ "e6", "brilliant" ],
            ],
            [
                [ "e1", "excellent" ],
            ],
        ],
        info: "22... Qxe1+?! also works, but is more dangerous for black's king after 23. Rxe1+.",
    });
    
    InteractiveChessboard("chess-puzzle-board-2", {
        position: "3rk2r/1p3p1p/p1n2p2/2PQp3/4BP2/6PP/P1qB4/R4RK1 w k - 4 23",
        solution: [
            ["d5", "d8", "wQ", "Qxd8+!"],
            ["e4", "c2", "wB", "Bxc2"],
        ],
        responses: [
            ["c6-d8", "Nxd8"],
        ],
        markings: [
            [
                [ "d8", "mistake" ],
            ],
            [
                [ "d8", "brilliant" ],
            ],
            null,
        ],
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-3", {
        position: "2n5/8/1p2k3/p3p1pR/4Kp2/3P1P2/PP4PP/8 b - - 2 32",
        solution: [
            ["c8", "d6", "bN", "Nd6#!"],
        ],
        responses: [
        ],
        markings: [
            [
                [ "h5", "blunder" ],
            ],
            [
                [ "d6", "excellent" ],
            ],
        ],
        orientation: "black",
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-4", {
        position: "8/1P6/8/7p/6p1/2P1kp2/6r1/5K1R b - - 0 54",
        solution: [
            ["g2", "c2", "bR", "Rc2!"],
            ["g4", "g3", "bP", "g3"],
            ["c2", "c1", "bR", "Rc1#"],
            // ["b2", "b8", "bR", "Rxb8!"],
        ],
        responses: [
            ["f1-g1", "Kg1"],
            ["b7-b8=Q", "b8=Q"],
            // ["f1-g1", "Kg1"],
            // ["h1-h5", "Rxh5"],
        ],
        markings: [
            [
                [ "b7", "blunder" ],
            ],
            [
                [ "c2", "excellent" ],
            ],
            null,
            [
                [ "g1", "mate" ],
            ],
        ],
        orientation: "black",
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-5", {
        position: "2kr1q1r/1ppb2pp/p1n1pn2/1B1p1p2/5P2/1PN1PN2/P1PPQ1PP/R4RK1 w - - 0 12",
        solution: [
            ["b5", "a6", "wB", "Bxa6!!"],
            ["e2", "a6", "wQ", "Qxa6+"],
        ],
        responses: [
            ["b7-a6", "bxa6"],
            ["c8-b8", "Kb8"],
        ],
        markings: [
            [
                [ "a6", "move" ],
            ],
            [
                [ "a6", "brilliant" ],
            ],
        ],
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-6", {
        position: "2kr4/pppq1p1r/2np3p/2n5/3B1P1b/1P2PB2/P1PPK2P/RN1Q1R2 b - - 4 16",
        solutions: [
            [
                ["c6", "d4", "bN", "Nxc4+"],
                ["d7", "e6", "bQ", "Qe6+"],
                ["e6", "e4", "bQ", "Qxe4#"],
            ],
            [
                ["c6", "d4", "bN", "Nxc4+"],
                ["d7", "e7", "bQ", "Qe7+"],
                ["e7", "e4", "bQ", "Qxe4#"],
            ],
            [
                ["c6", "d4", "bN", "Nxc4+"],
                ["d7", "e8", "bQ", "Qe8+"],
                ["e8", "e4", "bQ", "Qxe4#"],
            ],
        ],
        responses: [
            ["e3-d4", "exd4"],
            ["f3-e4", "Be4"],
        ],
        markings: [
            [
                [ "d4", "blunder" ],
            ],
            null,
            [
                [ "e6", "great" ],
                [ "e7", "great" ],
                [ "e8", "great" ],
            ],
            [
                [ "e2", "mate" ],
            ]
        ],
        orientation: "black",
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-7", {
        position: "4rrk1/ppp2pp1/5q1p/5b2/3B4/2bP1Q2/P1P4P/1R1K1B1R b - - 0 23",
        solution: [
            ["e8", "e1", "bR", "Re1#"],
        ],
        responses: [
        ],
        markings: [
            [
                [ "d4", "blunder" ],
            ],
            [
                [ "d1", "mate" ],
            ]
        ],
        orientation: "black",
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-8", {
        position: "8/8/5n2/8/7k/6p1/r6p/7K b - - 3 62",
        solution: [
            ["a2", "a1", "bR", "Ra1+"],
            ["h2", "h1", "bP", "h1=Q#"],
        ],
        responses: [
            ["h1-g2", "Kg2"],
        ],
        markings: [
            [
                [ "h1", "move" ],
            ],
            [
                // [ "a1", "move" ],
                // [ "g2", "move" ],
            ],
            [
                // [ "h1", "move" ],
            ]
        ],
        orientation: "black",
        info: "TODO: Allow the puzzle solver to choose a piece to promote to, and display their choice.",
    });
    
    InteractiveChessboard("chess-puzzle-board-9", {
        position: "1r2k2r/Q2n1pB1/4p2p/8/5b1q/1P6/P2P2PP/RN3RK1 b k - 0 16",
        solution: [
            ["f4", "h2", "bB", "Bxh2+!"],
            ["h2", "g3", "bB", "Bg3+"],
            ["h4", "h2", "bQ", "Qh2#" ],
        ],
        responses: [
            [ "g1-h1", "Kh1" ],
            [ "h1-g1", "Kg1" ],
        ],
        markings: [
            [
                [ "g7", "blunder" ],
            ],
            [
                [ "h2", "excellent" ],
            ],
            null,
            [
                [ "g1", "mate" ],
            ],
        ],
        orientation: "black",
        info: "16... Qxh2+ is winning, of course, but the King escapes, and lives a little longer.",
    });
    
    InteractiveChessboard("chess-puzzle-board-10", {
        position: "r2k3r/pppbRppp/8/6B1/8/1P1R4/P5PP/6K1 w - - 3 24",
        solution: [
            ["e7", "d7", "wR", "Rexd7+!"],
            ["d7", "d8", "wR", "Rd8+"],
            ["d3", "d8", "wR", "Rxd8#" ],
        ],
        responses: [
            [ "d8-e8", "Ke8" ],
            [ "a8-d8", "Rxd8" ],
        ],
        markings: [
            [
                [ "d7", "blunder" ],
            ],
            [
                [ "d7", "excellent" ],
            ],
            null,
            [
                [ "e8", "mate" ],
            ]
        ],
        info: "If 24...Kb8, the same exact sequence from white symmetrically produces checkmate.",
    });
    
    InteractiveChessboard("chess-puzzle-board-11", {
        position: "1k1r3r/p7/Qpp4b/3q1p2/3p1P2/PPP3KP/5P2/3RR3 b - - 5 26",
        solutions: [
            [
                ["d8", "g8", "bR", "Rdg8+"],
                ["h6", "f4", "bB", "Bxf4#"],
            ],
            [
                ["d8", "g8", "bR", "Rdg8+"],
                ["d5", "g2", "bQ", "Qg2#"],
            ],
        ],
        responses: [
            ["g3-h2", "Kh2"]
        ],
        markings: [
            [
                ["g3", "blunder"],
            ],
            null,
            [
                ["h2", "mate"],
            ],
        ],
        orientation: "black",
        info: "If 27.Kh4, then Bxf4# (or Bf8#), discovered checkmate.",
    });
    
    InteractiveChessboard("chess-puzzle-board-12", {
        position: "3R4/6pk/2p4p/2R5/2n5/4B2P/5PPK/1q6 b - - 1 42",
        solution: [
            ["c4", "e3", "bN", "Nxe3!"],
            ["b1", "b6", "bQ", "Qb6!"],
            ["c6", "d5", "bP", "cxd5"],
            ["b6", "e3", "bQ", "Qxe3"],
        ],
        responses: [
            ["f2-e3", "fxe3"],
            ["d8-d5", "Rdd5"],
            ["c5-d5", "Rxd5"],
        ],
        markings: [
            [
                ["c5", "blunder"],
            ],
            [
                ["e3", "excellent"],
            ],
            [
                ["b6", "excellent"],
            ],
            null,
            [
                ["e3", "great"],
            ],
        ],
        orientation: "black",
        info: "Although 43.fxe3 is certainly not forced, it is the most forcing move: Whereas with followups like Re5, black is spoiled for choice, the only move for black after 43.fxe3 is the tactical solution 43...Qb6.",
    });
    
    InteractiveChessboard("chess-puzzle-board-13", {
        position: "8/2p2p1k/p1b3pp/5Q2/1Pq1PR2/6P1/P4RKP/3r4 w - - 0 45",
        solution: [
            ["f5", "f7", "wQ", "Qxf7+"],
            ["f4", "f7", "wR", "Rxf7+"],
            ["f7", "f8", "wR", "Rf8+"],
            ["f2", "f7", "wR", "R2f7#"],
        ],
        responses: [
            ["c4-f7", "Qxf7"],
            ["h7-g8", "Kg8"],
            ["g8-g7", "Kg7"],
        ],
        markings: [
            [
                ["g6", "blunder"],
            ],
            null,
            null,
            null,
            [
                ["g7", "mate"],
            ]
        ],
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-14", {
        position: "r1b2rk1/ppq2ppp/2pbp3/Pn2N3/1P1P1B2/1Q4P1/5P1P/3RKB1R b K - 3 18",
        solution: [
            ["b5", "d4", "bN", "Nxd4!!"],
            ["d6", "e5", "bB", "Bxe5"],
            ["c7", "e5", "bQ", "Qxe5+"],
        ],
        responses: [
            ["d1-d4", "Rxd4"],
            ["f4-e5", "Bxe5"],
            ["b3-e3", "Qe3!"],
        ],
        markings: [
            [
                ["d1", "mistake"],
            ],
            [
                ["d4", "brilliant"],
            ],
            [
                ["e5", "great"],
            ],
            [
                ["e5", "great"],
                ["e3", "excellent"],
            ],
        ],
        orientation: "black",
        info: "Black's plan from here involves either a queen trade or retreating the queen, but both are respectable.",
    });
    
    // prevent mobile dragging around
    $(".chess-puzzle > .chess-board").on("touchmove", ev => ev.preventDefault());
});
