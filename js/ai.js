/* ============================================
   DOLANAN MATEMATIKA - AI LOGIC
   ============================================ */
"use strict";

const AI = (() => {

    // AI is always player index 1

    /**
     * Choose the best pion position and board cell for the AI.
     * Returns { pionCol: number, boardRow: number, boardCol: number }
     */
    function chooseMove() {
        const state = Game.getState();
        const board = state.board;
        const aiIdx = 1;
        const humanIdx = 0;
        const otherPionPos = state.players[humanIdx].pionPos;

        let bestScore = -Infinity;
        let bestMoves = [];

        // Try every possible position (0-9) for AI's pion
        for (let pos = 0; pos < BOARD_SIZE; pos++) {
            // Skip current position — must move to a different column
            if (pos === state.players[aiIdx].pionPos) continue;
            const sum = (otherPionPos + 1) + (pos + 1);
            // Skip positions that would exceed MAX_CELL_VALUE (18)
            if (sum > MAX_CELL_VALUE) continue;
            const availableCells = Game.getAvailableCellsForSum(sum);

            for (const cell of availableCells) {
                const score = evaluateMove(board, cell.row, cell.col, aiIdx, humanIdx);
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [{ pionCol: pos, boardRow: cell.row, boardCol: cell.col }];
                } else if (score === bestScore) {
                    bestMoves.push({ pionCol: pos, boardRow: cell.row, boardCol: cell.col });
                }
            }
        }

        if (bestMoves.length === 0) {
            // No valid moves — pick a column different from the AI's current position
            const currentPos = state.players[aiIdx].pionPos;
            const fallbackCol = (currentPos + 1) % BOARD_SIZE;
            return { pionCol: fallbackCol, boardRow: -1, boardCol: -1, noMoves: true };
        }

        // Pick randomly among best moves
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    /**
     * Evaluate a potential move at (row, col) for the given player.
     * Higher score = better move.
     */
    function evaluateMove(board, row, col, playerIdx, opponentIdx) {
        let score = 0;

        // 1) Check if this move wins immediately
        // checkWin doesn't read the target cell — safe without mutation
        const winCheck = Game.checkWin(row, col, playerIdx);

        if (winCheck) {
            return 100000; // Winning move — highest priority
        }

        // 2) Check if opponent could win here (blocking)
        const opponentWin = Game.checkWin(row, col, opponentIdx);

        if (opponentWin) {
            score += 50000; // Block opponent win
        }

        // 3) Count consecutive pieces in all 4 directions for the AI
        const aiStreaks = countStreaks(board, row, col, playerIdx);
        // 4) Count consecutive pieces in all 4 directions for opponent
        const oppStreaks = countStreaks(board, row, col, opponentIdx);

        // Score AI streaks
        for (const streak of aiStreaks) {
            if (streak >= 3) score += 5000;      // Will lead to 4
            else if (streak >= 2) score += 500;   // Building up
            else if (streak >= 1) score += 50;
        }

        // Score blocking opponent streaks
        for (const streak of oppStreaks) {
            if (streak >= 3) score += 8000;       // Must block!
            else if (streak >= 2) score += 300;
            else if (streak >= 1) score += 20;
        }

        // 5) Prefer center of the board (more connections possible)
        const centerDist = Math.abs(row - 4.5) + Math.abs(col - 4.5);
        score += Math.max(0, 10 - centerDist) * 5;

        // 6) Small random factor to avoid predictability
        score += Math.random() * 10;

        return score;
    }

    /**
     * Count streaks in all 4 directions around (row, col) for a player.
     * Returns an array of 4 streak lengths.
     */
    function countStreaks(board, row, col, playerIdx) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal ↘
            [1, -1]   // diagonal ↙
        ];

        const streaks = [];

        for (const [dr, dc] of directions) {
            let count = 0;

            // Forward
            for (let i = 1; i < WIN_LENGTH; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
                if (board[r][c].owner !== playerIdx) break;
                count++;
            }

            // Backward
            for (let i = 1; i < WIN_LENGTH; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
                if (board[r][c].owner !== playerIdx) break;
                count++;
            }

            streaks.push(count);
        }

        return streaks;
    }

    /**
     * Choose initial placement for AI's pion (during placement phase).
     * Returns a column index (0-9).
     */
    function chooseInitialPlacement(firstPionCol) {
        // Prefer center positions (4,5,6 = values 5,6,7) for more flexibility
        const preferred = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];

        // If placing second pion, respect disabled columns
        let disabledCols = [];
        if (firstPionCol !== undefined && firstPionCol !== null) {
            disabledCols = Game.getDisabledColumnsForPlacement(firstPionCol);
        }

        // Filter out disabled columns
        const allowedPreferred = preferred.filter(c => !disabledCols.includes(c));

        // Add a bit of randomness
        if (Math.random() < 0.3) {
            const allowedRange = [];
            for (let c = 2; c <= 7; c++) {
                if (!disabledCols.includes(c)) allowedRange.push(c);
            }
            if (allowedRange.length > 0) {
                return allowedRange[Math.floor(Math.random() * allowedRange.length)];
            }
        }
        return allowedPreferred.length > 0 ? allowedPreferred[0] : 0;
    }

    /**
     * AI chooses coin side.
     */
    function chooseCoinSide() {
        return Math.random() < 0.5 ? 'head' : 'tail';
    }

    return {
        chooseMove,
        chooseInitialPlacement,
        chooseCoinSide
    };
})();
