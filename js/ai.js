/* ============================================
   DOLANAN MATEMATIKA - AI LOGIC
   ============================================ */
"use strict";

const AI = (() => {

    // AI is always player index 1

    const DIFFICULTY_PROFILES = {
        easy: {
            winScore: 100000,
            blockWinBonus: 28000,
            selfStreak3: 2200,
            selfStreak2: 220,
            selfStreak1: 28,
            oppStreak3: 2600,
            oppStreak2: 140,
            oppStreak1: 14,
            centerWeight: 2.2,
            randomBonus: 42,
            lookaheadDepth: 0,
            candidateCap: 8,
            responseWeight: 0,
            topPickCount: 4,
            openingCenterWeight: 1.3,
            openingRandomBonus: 20,
            placementRandomChance: 0.65
        },
        normal: {
            winScore: 100000,
            blockWinBonus: 50000,
            selfStreak3: 5000,
            selfStreak2: 500,
            selfStreak1: 50,
            oppStreak3: 8000,
            oppStreak2: 300,
            oppStreak1: 20,
            centerWeight: 5,
            randomBonus: 10,
            lookaheadDepth: 0,
            candidateCap: 10,
            responseWeight: 0,
            topPickCount: 2,
            openingCenterWeight: 2.4,
            openingRandomBonus: 8,
            placementRandomChance: 0.3
        },
        hard: {
            winScore: 100000,
            blockWinBonus: 52000,
            selfStreak3: 5500,
            selfStreak2: 560,
            selfStreak1: 55,
            oppStreak3: 9000,
            oppStreak2: 360,
            oppStreak1: 26,
            centerWeight: 5.5,
            randomBonus: 3,
            lookaheadDepth: 2,
            candidateCap: 6,
            responseWeight: 0.75,
            topPickCount: 1,
            openingCenterWeight: 3,
            openingRandomBonus: 2,
            placementRandomChance: 0.08
        }
    };

    function getProfile(level) {
        return DIFFICULTY_PROFILES[level] || DIFFICULTY_PROFILES.normal;
    }

    /**
     * Choose the best pion position and board cell for the AI.
     * Returns { pionCol: number, boardRow: number, boardCol: number }
     */
    function chooseMove() {
        const state = Game.getState();
        const profile = getProfile(state.difficulty);
        const board = state.board;
        const aiIdx = 1;
        const humanIdx = 0;
        const otherPionPos = state.players[humanIdx].pionPos;

        const candidates = [];

        // Try every possible position (0-9) for AI's pion
        for (let pos = 0; pos < BOARD_SIZE; pos++) {
            // Skip current position — must move to a different column
            if (pos === state.players[aiIdx].pionPos) continue;
            const sum = (otherPionPos + 1) + (pos + 1);
            // Skip positions that would exceed MAX_CELL_VALUE (18)
            if (sum > MAX_CELL_VALUE) continue;
            const availableCells = Game.getAvailableCellsForSum(sum);

            for (const cell of availableCells) {
                const score = evaluateMove(board, cell.row, cell.col, aiIdx, humanIdx, profile);
                candidates.push({
                    pionCol: pos,
                    boardRow: cell.row,
                    boardCol: cell.col,
                    score
                });
            }
        }

        if (candidates.length === 0) {
            // No valid moves — pick a column different from the AI's current position
            const currentPos = state.players[aiIdx].pionPos;
            const fallbackCol = (currentPos + 1) % BOARD_SIZE;
            return { pionCol: fallbackCol, boardRow: -1, boardCol: -1, noMoves: true };
        }

        if (profile.lookaheadDepth >= 2) {
            const topCandidates = [...candidates]
                .sort((a, b) => b.score - a.score)
                .slice(0, profile.candidateCap);

            for (const candidate of topCandidates) {
                const oppBest = evaluateOpponentBestResponse(state, candidate, profile);
                candidate.score = candidate.score - (oppBest * profile.responseWeight);
            }

            topCandidates.sort((a, b) => b.score - a.score);
            return {
                pionCol: topCandidates[0].pionCol,
                boardRow: topCandidates[0].boardRow,
                boardCol: topCandidates[0].boardCol
            };
        }

        return pickFromTop(candidates, profile.topPickCount);
    }

    /**
     * Evaluate a potential move at (row, col) for the given player.
     * Higher score = better move.
     */
    function evaluateMove(board, row, col, playerIdx, opponentIdx, profile) {
        let score = 0;

        // 1) Check if this move wins immediately
        const winCheck = checkWinVirtual(board, row, col, playerIdx, BOARD_SIZE, WIN_LENGTH);

        if (winCheck) {
            return profile.winScore; // Winning move — highest priority
        }

        // 2) Check if opponent could win here (blocking)
        const opponentWin = checkWinVirtual(board, row, col, opponentIdx, BOARD_SIZE, WIN_LENGTH);

        if (opponentWin) {
            score += profile.blockWinBonus; // Block opponent win
        }

        // 3) Count consecutive pieces in all 4 directions for the AI
        const aiStreaks = countStreaks(board, row, col, playerIdx);
        // 4) Count consecutive pieces in all 4 directions for opponent
        const oppStreaks = countStreaks(board, row, col, opponentIdx);

        // Score AI streaks
        for (const streak of aiStreaks) {
            if (streak >= 3) score += profile.selfStreak3;
            else if (streak >= 2) score += profile.selfStreak2;
            else if (streak >= 1) score += profile.selfStreak1;
        }

        // Score blocking opponent streaks
        for (const streak of oppStreaks) {
            if (streak >= 3) score += profile.oppStreak3;
            else if (streak >= 2) score += profile.oppStreak2;
            else if (streak >= 1) score += profile.oppStreak1;
        }

        // 5) Prefer center of the board (more connections possible)
        const centerDist = Math.abs(row - 4.5) + Math.abs(col - 4.5);
        score += Math.max(0, 10 - centerDist) * profile.centerWeight;

        // 6) Small random factor to avoid predictability
        score += Math.random() * profile.randomBonus;

        return score;
    }

    function pickFromTop(candidates, topPickCount) {
        const sorted = [...candidates].sort((a, b) => b.score - a.score);
        const pickPool = sorted.slice(0, Math.max(1, Math.min(topPickCount, sorted.length)));
        const choice = pickPool[Math.floor(Math.random() * pickPool.length)];
        return {
            pionCol: choice.pionCol,
            boardRow: choice.boardRow,
            boardCol: choice.boardCol
        };
    }

    function cloneBoard(board) {
        return board.map(row => row.map(cell => ({ value: cell.value, owner: cell.owner })));
    }

    function getAvailableCellsForValue(board, targetValue) {
        const cells = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c].value === targetValue && board[r][c].owner === null) {
                    cells.push({ row: r, col: c });
                }
            }
        }
        return cells;
    }

    function evaluateOpponentBestResponse(state, aiMove, profile) {
        const aiIdx = 1;
        const humanIdx = 0;
        const simulatedBoard = cloneBoard(state.board);
        simulatedBoard[aiMove.boardRow][aiMove.boardCol].owner = aiIdx;

        const humanCurrentPos = state.players[humanIdx].pionPos;
        const aiNewPos = aiMove.pionCol;
        const responses = [];

        for (let humanPos = 0; humanPos < BOARD_SIZE; humanPos++) {
            if (humanPos === humanCurrentPos) continue;
            const sum = (humanPos + 1) + (aiNewPos + 1);
            if (sum > MAX_CELL_VALUE) continue;

            const availableCells = getAvailableCellsForValue(simulatedBoard, sum);
            for (const cell of availableCells) {
                const responseScore = evaluateMove(simulatedBoard, cell.row, cell.col, humanIdx, aiIdx, profile);
                responses.push(responseScore);
            }
        }

        if (responses.length === 0) return 0;
        return Math.max(...responses);
    }

    function checkWinVirtual(board, row, col, player, boardSize, winLength) {
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1]
        ];

        for (const [dr, dc] of directions) {
            let count = 1;

            for (let i = 1; i < winLength; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;
                if (board[r][c].owner !== player) break;
                count++;
            }

            for (let i = 1; i < winLength; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;
                if (board[r][c].owner !== player) break;
                count++;
            }

            if (count >= winLength) return true;
        }

        return false;
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
        const difficulty = Game.getDifficulty();
        const profile = getProfile(difficulty);

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
        if (Math.random() < profile.placementRandomChance) {
            const randomPool = allowedPreferred.slice(0, Math.min(5, allowedPreferred.length));
            if (randomPool.length > 0) return randomPool[Math.floor(Math.random() * randomPool.length)];
        }

        return allowedPreferred.length > 0 ? allowedPreferred[0] : 0;
    }

    function chooseFirstBoardPlacement(availableCells) {
        const difficulty = Game.getDifficulty();
        const profile = getProfile(difficulty);
        const board = Game.getBoard();
        const aiIdx = 1;
        const humanIdx = 0;

        const scored = availableCells.map(cell => {
            const tacticalScore = evaluateMove(board, cell.row, cell.col, aiIdx, humanIdx, profile);
            const centerDist = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
            const openingScore = tacticalScore + (Math.max(0, 10 - centerDist) * profile.openingCenterWeight) + (Math.random() * profile.openingRandomBonus);
            return { ...cell, score: openingScore };
        });

        const sorted = scored.sort((a, b) => b.score - a.score);
        const top = sorted.slice(0, Math.max(1, Math.min(profile.topPickCount, sorted.length)));
        return top[Math.floor(Math.random() * top.length)];
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
        chooseFirstBoardPlacement,
        chooseCoinSide
    };
})();
