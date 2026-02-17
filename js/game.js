/* ============================================
   DOLANAN MATEMATIKA - GAME LOGIC
   ============================================ */

// ---- Global Constants ----
const BOARD_SIZE = 10;
const WIN_LENGTH = 4;
const MIN_CELL_VALUE = 2;
const MAX_CELL_VALUE = 18;

const Game = (() => {
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
        additionBoard: [       // 2 rows x 10 cols (values 1-10)
            [1,2,3,4,5,6,7,8,9,10],
            [1,2,3,4,5,6,7,8,9,10]
        ],
        placementStep: 0,      // 0 = placing pion for row that coin winner picks first
        isFirstTurn: true,     // coin winner's first real turn after placement
        winner: null,
        winCells: [],
        moveHistory: []
    };

    // ---- Board Generation ----
    function generateBoard() {
        const board = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            const row = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                row.push({
                    value: randomInt(MIN_CELL_VALUE, MAX_CELL_VALUE),
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
    function init(mode, player1Name, player2Name) {
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
        state.phase = 'coin';
    }

    // ---- Coin Toss ----
    function coinToss(player1Choice) {
        // player1Choice: 'head' or 'tail'
        const result = Math.random() < 0.5 ? 'head' : 'tail';
        const p1Wins = (player1Choice === result);
        state.coinWinner = p1Wins ? 0 : 1;
        return { result, winner: state.coinWinner };
    }

    // ---- Placement (initial) ----
    // Coin winner places both pions: first one row, then the other
    function setPlacementPhase() {
        state.phase = 'placement';
        state.placementStep = 0; // 0 = first pion, 1 = second pion
    }

    // Place pion during initial placement
    // row: 0 or 1, col: 0-9 (position = col+1 => value 1-10)
    function placeInitialPion(row, col) {
        if (state.phase !== 'placement') return false;

        if (state.placementStep === 0) {
            // Place first pion (coin winner picks which row to place first)
            state.players[row].pionPos = col;
            state.placementStep = 1;
            return { done: false, placedRow: row };
        } else {
            // Place second pion (the other row)
            const otherRow = state.players[0].pionPos !== null ? 1 : 0;
            if (state.players[row].pionPos !== null) {
                // This row already has a pion, must place on the other row
                row = otherRow;
            }
            state.players[row].pionPos = col;
            state.placementStep = 2;
            // Now move to actual game — coin winner places on board first
            state.phase = 'place-board';
            state.currentPlayer = state.coinWinner;
            state.isFirstTurn = true;
            return { done: true, placedRow: row };
        }
    }

    // Get which row still needs pion placement
    function getUnplacedRow() {
        if (state.players[0].pionPos === null && state.players[1].pionPos === null) return 'both';
        if (state.players[0].pionPos === null) return 0;
        if (state.players[1].pionPos === null) return 1;
        return null;
    }

    // ---- Move Pion on Addition Board ----
    function movePion(playerIdx, newCol) {
        if (state.phase !== 'move-pion') return false;
        if (state.winner !== null) return false;

        // Validate: can this player move?
        if (!state.isFirstTurn && playerIdx !== state.currentPlayer) return false;

        // On first turn, coin winner can move either pion
        // On subsequent turns, player can only move their own pion
        if (newCol < 0 || newCol >= BOARD_SIZE) return false;

        // Prevent staying at the same position — must move to a different column
        if (newCol === state.players[playerIdx].pionPos) return false;

        state.players[playerIdx].pionPos = newCol;

        // Calculate sum
        const sum = getSum();

        // Check if there are available cells for this sum
        const availableCells = getAvailableCellsForSum(sum);

        state.phase = 'place-board';

        return {
            sum,
            availableCells,
            movedPlayer: playerIdx
        };
    }

    // ---- Get Sum ----
    function getSum() {
        const p1Pos = state.players[0].pionPos; // col index 0-9
        const p2Pos = state.players[1].pionPos;
        if (p1Pos === null || p2Pos === null) return null;
        // Values are col+1 (1-10)
        return (p1Pos + 1) + (p2Pos + 1);
    }

    // ---- Available Cells ----
    function getAvailableCellsForSum(sum) {
        const cells = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (state.board[r][c].value === sum && state.board[r][c].owner === null) {
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
        const sum = getSum();

        if (cell.value !== sum || cell.owner !== null) return false;

        cell.owner = state.currentPlayer;
        state.players[state.currentPlayer].pionsOnBoard++;

        state.moveHistory.push({
            player: state.currentPlayer,
            row, col,
            pionPositions: [state.players[0].pionPos, state.players[1].pionPos]
        });

        // Check win
        const winResult = checkWin(row, col, state.currentPlayer);
        if (winResult) {
            state.winner = state.currentPlayer;
            state.winCells = winResult;
            return { win: true, winner: state.currentPlayer, winCells: winResult };
        }

        // Next turn
        advanceTurn();

        return { win: false };
    }

    // Skip turn when no available cells
    function skipTurn() {
        if (state.phase !== 'place-board') return;
        advanceTurn();
    }

    function advanceTurn() {
        state.isFirstTurn = false;
        state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
        state.phase = 'move-pion';
    }

    // ---- Win Check ----
    // Check if placing at (row, col) creates 4 in a row for player
    function checkWin(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal ↘
            [1, -1]   // diagonal ↙
        ];

        for (const [dr, dc] of directions) {
            const cells = [{ row, col }];

            // Count forward
            for (let i = 1; i < WIN_LENGTH; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
                if (state.board[r][c].owner !== player) break;
                cells.push({ row: r, col: c });
            }

            // Count backward
            for (let i = 1; i < WIN_LENGTH; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
                if (state.board[r][c].owner !== player) break;
                cells.push({ row: r, col: c });
            }

            if (cells.length >= WIN_LENGTH) return cells;
        }

        return null;
    }

    // ---- Check if any moves available for a sum ----
    function hasMovesForAnyPionPosition(playerIdx) {
        // Check all 10 possible positions for this player's pion
        for (let pos = 0; pos < BOARD_SIZE; pos++) {
            // Skip current position — player must move
            if (pos === state.players[playerIdx].pionPos) continue;
            const otherPlayerPos = state.players[1 - playerIdx].pionPos;
            const sum = (pos + 1) + (otherPlayerPos + 1);
            if (sum > MAX_CELL_VALUE) continue;
            const available = getAvailableCellsForSum(sum);
            if (available.length > 0) return true;
        }
        return false;
    }

    // ---- Disabled Columns (sum would exceed MAX_CELL_VALUE) ----
    // Returns array of column indices (0-9) that are disabled for a given player
    // during the move-pion phase. For isFirstTurn, returns { 0: [...], 1: [...] }
    // keyed by row, since the coin winner can move either pion.
    function getDisabledColumns(playerIdx) {
        if (state.isFirstTurn) {
            // Coin winner can move either pion — compute per-row
            const result = {};
            for (let row = 0; row < 2; row++) {
                const otherRow = 1 - row;
                const otherVal = state.players[otherRow].pionPos + 1; // 1-10
                const maxAllowed = MAX_CELL_VALUE - otherVal; // max value for this row's pion
                const disabled = [];
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if ((c + 1) > maxAllowed) disabled.push(c);
                }
                // Also disable current position — player must move to a different column
                const currentPos = state.players[row].pionPos;
                if (currentPos !== null && !disabled.includes(currentPos)) {
                    disabled.push(currentPos);
                }
                result[row] = disabled;
            }
            return result;
        } else {
            // Normal turn: player can only move their own pion
            const otherVal = state.players[1 - playerIdx].pionPos + 1;
            const maxAllowed = MAX_CELL_VALUE - otherVal;
            const disabled = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                if ((c + 1) > maxAllowed) disabled.push(c);
            }
            // Also disable current position — player must move to a different column
            const currentPos = state.players[playerIdx].pionPos;
            if (currentPos !== null && !disabled.includes(currentPos)) {
                disabled.push(currentPos);
            }
            return disabled;
        }
    }

    // Returns array of disabled column indices for the second pion during initial placement.
    // firstPionCol is the column (0-9) of the already-placed pion.
    function getDisabledColumnsForPlacement(firstPionCol) {
        if (firstPionCol === null || firstPionCol === undefined) return [];
        const firstVal = firstPionCol + 1;
        const maxAllowed = MAX_CELL_VALUE - firstVal;
        const disabled = [];
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((c + 1) > maxAllowed) disabled.push(c);
        }
        return disabled;
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

    return {
        init,
        coinToss,
        setPlacementPhase,
        placeInitialPion,
        getUnplacedRow,
        movePion,
        getSum,
        getAvailableCellsForSum,
        placeOnBoard,
        skipTurn,
        checkWin,
        hasMovesForAnyPionPosition,
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
        generateBoard,
        randomInt
    };
})();
