/* ============================================
   DOLANAN MATEMATIKA - GAME LOGIC (PERKALIAN)
   ============================================ */
"use strict";

// ---- Global Constants for Multiplication Game ----
const MULT_BOARD_SIZE = 10;
const MULT_WIN_LENGTH = 4;
const MULT_COLS = 9; // Multiplication board has 9 columns (values 1-9)

// All valid products of two numbers from 1 to 9
const VALID_PRODUCTS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    12, 14, 15, 16, 18, 20, 21, 24, 25, 27,
    28, 30, 32, 35, 36, 40, 42, 45, 48, 49,
    54, 56, 63, 64, 72, 81
];

const GameMult = (() => {
    // ---- State ----
    let state = {
        mode: 'pvp',           // 'pvp' or 'ai'
        players: [
            { name: 'Pemain 1', color: 'blue', pionPos: null, pionsOnBoard: 0 },
            { name: 'Pemain 2', color: 'red', pionPos: null, pionsOnBoard: 0 }
        ],
        currentPlayer: 0,      // 0 = player1, 1 = player2
        phase: 'menu',         // menu | coin | placement | move-pion | place-board
        coinWinner: null,      // 0 or 1
        board: [],             // 10x10 array: { value: number, owner: null|0|1 }
        multiplicationBoard: [ // 2 rows x 9 cols (values 1-9)
            [1,2,3,4,5,6,7,8,9],
            [1,2,3,4,5,6,7,8,9]
        ],
        placementStep: 0,      // 0 = placing pion for row that coin winner picks first
        isFirstTurn: true,     // coin winner's first real turn after placement
        winner: null,
        winCells: [],
        moveHistory: [],
        timeLimit: 30          // seconds per turn, 0 = unlimited
    };

    // ---- Board Generation ----
    function generateBoard() {
        const board = [];
        for (let r = 0; r < MULT_BOARD_SIZE; r++) {
            const row = [];
            for (let c = 0; c < MULT_BOARD_SIZE; c++) {
                row.push({
                    value: VALID_PRODUCTS[randomInt(0, VALID_PRODUCTS.length - 1)],
                    owner: null
                });
            }
            board.push(row);
        }
        return board;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ---- Init ----
    function init(mode, player1Name, player2Name, timeLimit) {
        state.mode = mode;
        state.players[0].name = player1Name || 'Pemain 1';
        state.players[1].name = player2Name || (mode === 'ai' ? 'AI' : 'Pemain 2');
        state.players[0].pionPos = null;
        state.players[1].pionPos = null;
        state.players[0].pionsOnBoard = 0;
        state.players[1].pionsOnBoard = 0;
        state.currentPlayer = 0;
        state.board = generateBoard();
        state.coinWinner = null;
        state.placementStep = 0;
        state.isFirstTurn = true;
        state.winner = null;
        state.winCells = [];
        state.moveHistory = [];
        state.timeLimit = (timeLimit !== undefined && timeLimit !== null) ? timeLimit : 30;
        state.phase = 'coin';
    }

    // ---- Coin Toss ----
    function coinToss(player1Choice) {
        const result = Math.random() < 0.5 ? 'head' : 'tail';
        const p1Wins = (player1Choice === result);
        state.coinWinner = p1Wins ? 0 : 1;
        return { result, winner: state.coinWinner };
    }

    // ---- Placement (initial) ----
    function setPlacementPhase() {
        state.phase = 'placement';
        state.placementStep = 0;
    }

    // Place pion during initial placement
    // row: 0 or 1, col: 0-8 (position = col+1 => value 1-9)
    function placeInitialPion(row, col) {
        if (state.phase !== 'placement') return false;

        if (state.placementStep === 0) {
            state.players[row].pionPos = col;
            state.placementStep = 1;
            return { done: false, placedRow: row };
        } else {
            const otherRow = state.players[0].pionPos !== null ? 1 : 0;
            if (state.players[row].pionPos !== null) {
                row = otherRow;
            }
            state.players[row].pionPos = col;
            state.placementStep = 2;
            state.phase = 'place-board';
            state.currentPlayer = state.coinWinner;
            state.isFirstTurn = true;
            return { done: true, placedRow: row };
        }
    }

    function getUnplacedRow() {
        if (state.players[0].pionPos === null && state.players[1].pionPos === null) return 'both';
        if (state.players[0].pionPos === null) return 0;
        if (state.players[1].pionPos === null) return 1;
        return null;
    }

    // ---- Move Pion on Multiplication Board ----
    function movePion(playerIdx, newCol) {
        if (state.phase !== 'move-pion') return false;
        if (state.winner !== null) return false;

        if (!state.isFirstTurn && playerIdx !== state.currentPlayer) return false;

        if (newCol < 0 || newCol >= MULT_COLS) return false;

        // Prevent staying at the same position
        if (newCol === state.players[playerIdx].pionPos) return false;

        state.players[playerIdx].pionPos = newCol;

        const product = getProduct();
        const availableCells = getAvailableCellsForProduct(product);

        state.phase = 'place-board';

        return {
            product,
            availableCells,
            movedPlayer: playerIdx
        };
    }

    // ---- Get Product ----
    function getProduct() {
        const p1Pos = state.players[0].pionPos; // col index 0-8
        const p2Pos = state.players[1].pionPos;
        if (p1Pos === null || p2Pos === null) return null;
        // Values are col+1 (1-9)
        return (p1Pos + 1) * (p2Pos + 1);
    }

    // ---- Available Cells ----
    function getAvailableCellsForProduct(product) {
        const cells = [];
        for (let r = 0; r < MULT_BOARD_SIZE; r++) {
            for (let c = 0; c < MULT_BOARD_SIZE; c++) {
                if (state.board[r][c].value === product && state.board[r][c].owner === null) {
                    cells.push({ row: r, col: c });
                }
            }
        }
        return cells;
    }

    // ---- Place on Board ----
    function placeOnBoard(row, col) {
        if (state.phase !== 'place-board') return false;
        if (state.winner !== null) return false;

        const cell = state.board[row][col];
        const product = getProduct();

        if (cell.value !== product || cell.owner !== null) return false;

        cell.owner = state.currentPlayer;
        state.players[state.currentPlayer].pionsOnBoard++;

        state.moveHistory.push({
            player: state.currentPlayer,
            row, col,
            pionPositions: [state.players[0].pionPos, state.players[1].pionPos]
        });

        const winResult = checkWin(row, col, state.currentPlayer);
        if (winResult) {
            state.winner = state.currentPlayer;
            state.winCells = winResult;
            return { win: true, winner: state.currentPlayer, winCells: winResult };
        }

        advanceTurn();
        return { win: false };
    }

    function skipTurn() {
        if (state.phase !== 'place-board' && state.phase !== 'move-pion') return;
        advanceTurn();
    }

    function advanceTurn() {
        state.isFirstTurn = false;
        state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
        state.phase = 'move-pion';
    }

    // ---- Win Check ----
    // Check if placing at (row, col) creates 4 in a row for player.
    // NOTE: This function assumes (row, col) already belongs to `player`.
    // It is always called from placeOnBoard() which sets ownership before invoking checkWin.
    function checkWin(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal ↘
            [1, -1]   // diagonal ↙
        ];

        for (const [dr, dc] of directions) {
            const cells = [{ row, col }];

            for (let i = 1; i < MULT_WIN_LENGTH; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r < 0 || r >= MULT_BOARD_SIZE || c < 0 || c >= MULT_BOARD_SIZE) break;
                if (state.board[r][c].owner !== player) break;
                cells.push({ row: r, col: c });
            }

            for (let i = 1; i < MULT_WIN_LENGTH; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r < 0 || r >= MULT_BOARD_SIZE || c < 0 || c >= MULT_BOARD_SIZE) break;
                if (state.board[r][c].owner !== player) break;
                cells.push({ row: r, col: c });
            }

            if (cells.length >= MULT_WIN_LENGTH) return cells;
        }

        return null;
    }

    // ---- Check if any moves available for a product ----
    function hasMovesForAnyPionPosition(playerIdx) {
        for (let pos = 0; pos < MULT_COLS; pos++) {
            if (pos === state.players[playerIdx].pionPos) continue;
            const otherPlayerPos = state.players[1 - playerIdx].pionPos;
            const product = (pos + 1) * (otherPlayerPos + 1);
            const available = getAvailableCellsForProduct(product);
            if (available.length > 0) return true;
        }
        return false;
    }

    // ---- Auto Game Over Check ----
    function checkAutoGameOver(playerIdx) {
        if (state.isFirstTurn) {
            for (let row = 0; row < 2; row++) {
                const otherRow = 1 - row;
                const otherVal = state.players[otherRow].pionPos + 1;
                for (let pos = 0; pos < MULT_COLS; pos++) {
                    if (pos === state.players[row].pionPos) continue;
                    const product = (pos + 1) * otherVal;
                    const available = getAvailableCellsForProduct(product);
                    if (available.length > 0) {
                        return { autoLose: true, loser: playerIdx, winner: 1 - playerIdx };
                    }
                }
            }
            return { draw: true };
        } else {
            if (hasMovesForAnyPionPosition(playerIdx)) {
                return { autoLose: true, loser: playerIdx, winner: 1 - playerIdx };
            }
            return { draw: true };
        }
    }

    // ---- Set Winner (for auto game over) ----
    function setWinner(playerIdx) {
        state.winner = playerIdx;
    }

    // ---- Set Draw ----
    function setDraw() {
        state.winner = -1;
    }

    // ---- Disabled Columns ----
    // For multiplication, no columns are disabled by value range (all products 1-81 are valid).
    // Only the current position is disabled (must move to a different column).
    function getDisabledColumns(playerIdx) {
        if (state.isFirstTurn) {
            const result = {};
            for (let row = 0; row < 2; row++) {
                const disabled = [];
                const currentPos = state.players[row].pionPos;
                if (currentPos !== null) {
                    disabled.push(currentPos);
                }
                result[row] = disabled;
            }
            return result;
        } else {
            const disabled = [];
            const currentPos = state.players[playerIdx].pionPos;
            if (currentPos !== null) {
                disabled.push(currentPos);
            }
            return disabled;
        }
    }

    // No placement constraints for multiplication — all products are valid
    function getDisabledColumnsForPlacement(firstPionCol) {
        return [];
    }

    // ---- Getters ----
    function getState() {
        return state;
    }

    function getBoard() {
        return state.board;
    }

    function getPlayers() {
        return state.players;
    }

    function getCurrentPlayer() {
        return state.currentPlayer;
    }

    function getPhase() {
        return state.phase;
    }

    function isAIMode() {
        return state.mode === 'ai';
    }

    function isAITurn() {
        return state.mode === 'ai' && state.currentPlayer === 1;
    }

    function getWinner() {
        return state.winner;
    }

    function getWinCells() {
        return state.winCells;
    }

    function isFirstTurn() {
        return state.isFirstTurn;
    }

    function getCoinWinner() {
        return state.coinWinner;
    }

    function getTimeLimit() {
        return state.timeLimit;
    }

    return {
        init,
        coinToss,
        setPlacementPhase,
        placeInitialPion,
        getUnplacedRow,
        movePion,
        getProduct,
        getAvailableCellsForProduct,
        placeOnBoard,
        skipTurn,
        checkWin,
        hasMovesForAnyPionPosition,
        checkAutoGameOver,
        setWinner,
        setDraw,
        getDisabledColumns,
        getDisabledColumnsForPlacement,
        getState,
        getBoard,
        getPlayers,
        getCurrentPlayer,
        getPhase,
        isAIMode,
        isAITurn,
        getWinner,
        getWinCells,
        isFirstTurn,
        getCoinWinner,
        getTimeLimit,
        generateBoard,
        randomInt
    };
})();
