const BASE_CONFIG = {
    draggable: true,
    pieceTheme: "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png",
    moveSpeed: 200,
};

const InteractiveChessboard = (id, cfg) => {
    let playerToMove = cfg.position.split(" ")[1];
    
    // console.log(playerToMove);
    
    let baseElement = document.getElementById(id);
    let parent = baseElement.parentElement;
    let moveOrder = parent.querySelector(".move-order ol");
    let messageHolder = parent.querySelector(".message");
    
    let state = {
        playerToMove,
        moveOrder,
        board: null,
        solved: false,
        solutions: cfg.solutions ?? [ cfg.solution ],
        responses: cfg.responses,
        solutionIndex: 0,
        get currentStep() {
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
            span.textContent = this.currentStep[0][3];
            if(span.textContent.endsWith("!!")) {
                span.className = "brilliant";
            }
            else if(span.textContent.endsWith("!")) {
                span.className = "excellent";
            }
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
            if(!this.responses[this.solutionIndex]) {
                return;
            }
            let [ move, moveReadable ] = this.responses[this.solutionIndex];
            this.solutionIndex++;
            setTimeout(() => {
                if(playerToMove === "b") {
                    li = document.createElement("li");
                    moveOrder.appendChild(li);
                }
                let span = document.createElement("span");
                span.textContent = moveReadable;
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
                    }, BASE_CONFIG.moveSpeed);
                }
            }, this.delay);
        },
        delay: 100, //ms
    };
    
    let config = Object.assign({}, BASE_CONFIG, cfg, {
        onDragStart(source, piece, position, orientation) {
            return !state.solved && piece[0] === state.playerToMove;
        },
        onDrop(source, target, piece, newPos, oldPos, orientation) {
            if(source === target) {
                // ignore
                return;
            }
            let anySolution = state.currentStep.find(expectedSolution => {
                let [ expectedSource, expectedTarget, expectedPiece ] = expectedSolution;
                return source === expectedSource && target === expectedTarget && piece === expectedPiece;
            });
            if(anySolution) {
                state.nextMove(source, target, piece);
            }
            else {
                messageHolder.textContent = "That's not it.";
                // TODO: give feedback to the user about what went wrong
                return "snapback";
            }
        },
    });
    return state.board = Chessboard(id, config);
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
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-3", {
        position: "2n5/8/1p2k3/p3p1pR/4Kp2/3P1P2/PP4PP/8 b - - 2 32",
        solution: [
            ["c8", "d6", "bN", "Nd6#!"],
        ],
        responses: [
        ],
        orientation: "black",
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-4", {
        position: "8/1P6/8/7p/6p1/2P1kp2/6r1/5K1R b - - 0 54",
        solution: [
            ["g2", "b2", "bR", "Rb2!"],
            ["b2", "b8", "bR", "Rxb8!"],
            ["g4", "g3", "bP", "g3"],
            ["b8", "b1", "bR", "Rb1#"],
        ],
        responses: [
            ["b7-b8=Q", "b8=Q"],
            ["f1-g1", "Kg1"],
            ["h1-h5", "Rxh5"],
        ],
        orientation: "black",
        info: null,
    });
    
    InteractiveChessboard("chess-puzzle-board-5", {
        position: "2kr1q1r/1ppb2pp/p1n1pn2/1B1p1p2/5P2/1PN1PN2/P1PPQ1PP/R4RK1 w - - 0 12",
        solution: [
            ["b5", "a6", "wB", "Bxc6!!"],
            ["e2", "a6", "wQ", "Qxa6+"],
        ],
        responses: [
            ["b7-a6", "bxa6"],
            ["c8-b8", "Kb8"],
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
        info: "If 24...Kb8, the same exact sequence from white symmetrically produces checkmate.",
    });
});
