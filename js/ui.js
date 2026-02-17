/* ============================================
   DOLANAN MATEMATIKA - UI / DOM CONTROLLER
   ============================================ */

const UI = (() => {
    // ---- DOM References ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Screens
    const menuScreen = $('#menu-screen');
    const coinScreen = $('#coin-screen');
    const placementScreen = $('#placement-screen');
    const gameScreen = $('#game-screen');

    // Menu
    const modeButtons = $$('.mode-btn');
    const player1Input = $('#player1-name');
    const player2Input = $('#player2-name');
    const player2Group = $('#player2-input');
    const startBtn = $('#start-btn');

    // Coin
    const coinEl = $('#coin');
    const coinChoices = $('#coin-choices');
    const coinInstruction = $('#coin-instruction');
    const coinResult = $('#coin-result');
    const coinResultText = $('#coin-result-text');
    const coinContinueBtn = $('#coin-continue-btn');

    // Placement
    const placementTitle = $('#placement-title');
    const placementInstruction = $('#placement-instruction');
    const placementAddBoard = $('#placement-addition-board');
    const placementConfirmBtn = $('#placement-confirm-btn');

    // Game
    const gameBoard = $('#game-board');
    const gameAddBoard = $('#game-addition-board');
    const turnIndicator = $('#turn-indicator');
    const sumDisplay = $('#sum-value');
    const phaseInstruction = $('#phase-instruction');
    const p1NameDisplay = $('#p1-name-display');
    const p2NameDisplay = $('#p2-name-display');
    const p1Score = $('#p1-score');
    const p2Score = $('#p2-score');
    const p1Info = $('#player1-info');
    const p2Info = $('#player2-info');

    // Overlays
    const winOverlay = $('#win-overlay');
    const winTitle = $('#win-title');
    const winMessage = $('#win-message');
    const playAgainBtn = $('#play-again-btn');
    const backMenuBtn = $('#back-menu-btn');
    const drawOverlay = $('#draw-overlay');
    const drawMessage = $('#draw-message');
    const drawContinueBtn = $('#draw-continue-btn');

    let selectedMode = 'pvp';
    let aiTimerIds = [];

    function scheduleAI(fn, delay) {
        const id = setTimeout(fn, delay);
        aiTimerIds.push(id);
        return id;
    }

    function clearAllAITimers() {
        aiTimerIds.forEach(id => clearTimeout(id));
        aiTimerIds = [];
    }

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ============================================
    // INIT / EVENT LISTENERS
    // ============================================
    function init() {
        // Mode buttons
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedMode = btn.dataset.mode;
                if (selectedMode === 'ai') {
                    player2Group.style.display = 'none';
                } else {
                    player2Group.style.display = 'block';
                }
            });
        });

        // Start button
        startBtn.addEventListener('click', startGame);

        // Coin buttons
        $$('.coin-btn').forEach(btn => {
            btn.addEventListener('click', () => handleCoinChoice(btn.dataset.choice));
        });

        // Coin continue
        coinContinueBtn.addEventListener('click', goToPlacement);

        // Placement confirm
        placementConfirmBtn.addEventListener('click', confirmPlacement);

        // Win overlay
        playAgainBtn.addEventListener('click', () => {
            winOverlay.style.display = 'none';
            startGame();
        });
        backMenuBtn.addEventListener('click', () => {
            winOverlay.style.display = 'none';
            showScreen('menu');
        });

        // Draw overlay
        drawContinueBtn.addEventListener('click', () => {
            drawOverlay.style.display = 'none';
            Game.skipTurn();
            updateGameUI();
            if (Game.isAITurn()) {
                scheduleAI(doAITurn, 800);
            }
        });

        // Event delegation — set up once, works for all future cells
        gameBoard.addEventListener('click', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) return;
            handleBoardClick(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        });

        gameAddBoard.addEventListener('click', (e) => {
            const cell = e.target.closest('.add-cell');
            if (!cell) return;
            if (!cell.classList.contains('clickable')) return;
            handleAddBoardClick(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        });

        placementAddBoard.addEventListener('click', (e) => {
            const cell = e.target.closest('.add-cell');
            if (!cell) return;
            if (!cell.classList.contains('clickable')) return;
            handlePlacementClick(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        });
    }

    // ============================================
    // SCREEN MANAGEMENT
    // ============================================
    function showScreen(name) {
        $$('.screen').forEach(s => s.classList.remove('active'));
        switch(name) {
            case 'menu': menuScreen.classList.add('active'); break;
            case 'coin': coinScreen.classList.add('active'); break;
            case 'placement': placementScreen.classList.add('active'); break;
            case 'game': gameScreen.classList.add('active'); break;
        }
    }

    // ============================================
    // START GAME
    // ============================================
    function startGame() {
        clearAllAITimers();
        const p1Name = player1Input.value.trim() || 'Pemain 1';
        const p2Name = selectedMode === 'ai' ? 'AI' : (player2Input.value.trim() || 'Pemain 2');

        Game.init(selectedMode, p1Name, p2Name);

        // Reset coin UI
        coinEl.className = 'coin';
        coinChoices.style.display = 'flex';
        coinResult.style.display = 'none';
        coinInstruction.textContent = `${p1Name}, pilih sisi koin:`;

        showScreen('coin');
    }

    // ============================================
    // COIN TOSS
    // ============================================
    function handleCoinChoice(choice) {
        // If AI mode and it's AI's turn to choose (AI is player 2 — but player 1 always chooses first)
        coinChoices.style.display = 'none';

        const { result, winner } = Game.coinToss(choice);

        // Animate coin
        coinEl.className = 'coin';
        void coinEl.offsetWidth; // force reflow
        if (result === 'head') {
            coinEl.classList.add('flipping');
        } else {
            coinEl.classList.add('show-tail');
        }

        setTimeout(() => {
            const players = Game.getPlayers();
            const winnerName = escapeHTML(players[winner].name);
            const p1Display = escapeHTML(players[0].name);
            const resultLabel = result === 'head' ? 'Head' : 'Tail';

            coinResultText.innerHTML = `Hasil: <strong>${resultLabel}</strong><br>` +
                `${p1Display} memilih: <strong>${choice === 'head' ? 'Head' : 'Tail'}</strong><br><br>` +
                `🎉 <strong>${winnerName}</strong> menang coin toss!<br>` +
                `${winnerName} akan menempatkan kedua pion terlebih dahulu.`;

            coinResult.style.display = 'block';
        }, 2200);
    }

    // ============================================
    // PLACEMENT
    // ============================================
    function goToPlacement() {
        Game.setPlacementPhase();
        const players = Game.getPlayers();
        const winner = Game.getCoinWinner();

        placementInstruction.textContent =
            `${players[winner].name}, letakkan pion pertama di salah satu baris. Klik angka yang diinginkan.`;

        createPlacementBoard();
        updatePlacementCells();
        placementConfirmBtn.style.display = 'none';
        showScreen('placement');

        // If AI won, and AI mode, AI places both pions
        if (Game.isAIMode() && winner === 1) {
            scheduleAI(doAIPlacement, 800);
        }
    }

    function createPlacementBoard() {
        placementAddBoard.innerHTML = '';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'add-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.textContent = c + 1;
                placementAddBoard.appendChild(cell);
            }
        }
    }

    function updatePlacementCells() {
        const players = Game.getPlayers();
        const state = Game.getState();
        const cells = placementAddBoard.children;

        // Compute disabled columns for second pion placement
        let disabledCols = [];
        if (state.placementStep === 1) {
            // One pion already placed — find its column
            const placedCol = players[0].pionPos !== null ? players[0].pionPos : players[1].pionPos;
            disabledCols = Game.getDisabledColumnsForPlacement(placedCol);
        }

        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const idx = r * BOARD_SIZE + c;
                const cell = cells[idx];
                cell.classList.remove('pion-here-1', 'pion-here-2', 'clickable', 'disabled');

                if (players[r].pionPos === c) {
                    cell.classList.add(r === 0 ? 'pion-here-1' : 'pion-here-2');
                }

                if (state.phase === 'placement') {
                    const unplaced = Game.getUnplacedRow();
                    const canClick = (unplaced === 'both') || (unplaced === r);
                    if (canClick && players[r].pionPos === null) {
                        if (disabledCols.includes(c)) {
                            cell.classList.add('disabled');
                        } else {
                            cell.classList.add('clickable');
                        }
                    }
                }
            }
        }
    }

    function handlePlacementClick(row, col) {
        // Guard: if placing second pion, check disabled columns
        const placementState = Game.getState();
        if (placementState.placementStep === 1) {
            const players = Game.getPlayers();
            const placedCol = players[0].pionPos !== null ? players[0].pionPos : players[1].pionPos;
            const disabledCols = Game.getDisabledColumnsForPlacement(placedCol);
            if (disabledCols.includes(col)) return;
        }

        const result = Game.placeInitialPion(row, col);
        if (!result) return;

        const players = Game.getPlayers();
        const winner = Game.getCoinWinner();

        if (!result.done) {
            // Need to place second pion
            const unplaced = Game.getUnplacedRow();
            placementInstruction.textContent =
                `${players[winner].name}, sekarang letakkan pion kedua di baris ${unplaced === 0 ? '1 (Biru)' : '2 (Merah)'}.`;
            updatePlacementCells();

            // If AI mode and human won coin toss, human places both — no AI action here
        } else {
            // Both placed, go to game
            updatePlacementCells();
            placementInstruction.textContent = 'Kedua pion telah ditempatkan! Siap bermain.';
            placementConfirmBtn.style.display = 'block';
        }
    }

    function confirmPlacement() {
        setupGameUI();
        showScreen('game');

        // After placement, coin winner immediately places on board
        const sum = Game.getSum();
        const availableCells = Game.getAvailableCellsForSum(sum);
        const players = Game.getPlayers();
        const current = Game.getCurrentPlayer();

        sumDisplay.textContent = sum;
        phaseInstruction.textContent = `${players[current].name}, pilih cell bernilai ${sum} di Board Permainan`;

        if (availableCells.length > 0) {
            highlightAvailableCells(availableCells);
        } else {
            // No cells for this sum — skip to next turn
            drawMessage.textContent = `Tidak ada cell bernilai ${sum} yang tersedia. Giliran dilewati.`;
            drawOverlay.style.display = 'flex';
        }

        // If AI won coin toss, AI places on board
        if (Game.isAITurn()) {
            scheduleAI(() => doAIFirstPlacement(sum, availableCells), 800);
        }
    }

    function doAIPlacement() {
        // AI places first pion
        const col1 = AI.chooseInitialPlacement();
        // Place on row 1 (AI's row) first, or row 0
        const unplaced1 = Game.getUnplacedRow();
        let firstRow = 1; // AI prefers its own row first
        if (unplaced1 !== 'both' && unplaced1 !== 1) firstRow = 0;

        handlePlacementClick(firstRow, col1);

        scheduleAI(() => {
            // AI places second pion, passing first pion's column for constraint
            const col2 = AI.chooseInitialPlacement(col1);
            const unplaced2 = Game.getUnplacedRow();
            if (unplaced2 !== null && unplaced2 !== 'both') {
                handlePlacementClick(unplaced2, col2);
            }

            scheduleAI(() => {
                confirmPlacement();
            }, 600);
        }, 800);
    }

    // AI places on board right after initial placement (when AI won coin toss)
    function doAIFirstPlacement(sum, availableCells) {
        if (availableCells.length === 0) {
            Game.skipTurn();
            updateGameUI();
            return;
        }

        // Use AI evaluation to pick the best cell
        const board = Game.getBoard();
        let bestScore = -Infinity;
        let bestCell = availableCells[0];
        for (const cell of availableCells) {
            // Simple scoring: center preference + random
            const centerDist = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
            const score = (10 - centerDist) + Math.random() * 5;
            if (score > bestScore) {
                bestScore = score;
                bestCell = cell;
            }
        }

        const placeResult = Game.placeOnBoard(bestCell.row, bestCell.col);
        clearHighlights();

        if (placeResult && placeResult.win) {
            updateBoardCells();
            highlightWinCells(placeResult.winCells);
            updateScores();
            showWinOverlay(placeResult.winner);
            return;
        }

        updateGameUI();
    }

    // ============================================
    // GAME UI
    // ============================================
    function setupGameUI() {
        const players = Game.getPlayers();
        p1NameDisplay.textContent = players[0].name;
        p2NameDisplay.textContent = players[1].name;

        createGameBoard();
        createGameAddBoard();
        updateGameUI();
    }

    function createGameBoard() {
        gameBoard.innerHTML = '';
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                gameBoard.appendChild(cell);
            }
        }
    }

    function updateBoardCells() {
        const board = Game.getBoard();
        const cells = gameBoard.children;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const idx = r * BOARD_SIZE + c;
                const cell = cells[idx];
                const data = board[r][c];
                cell.textContent = data.value;
                cell.classList.remove('taken-1', 'taken-2', 'highlight', 'win-cell');
                if (data.owner === 0) cell.classList.add('taken-1');
                else if (data.owner === 1) cell.classList.add('taken-2');
            }
        }
    }

    function createGameAddBoard() {
        gameAddBoard.innerHTML = '';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'add-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.textContent = c + 1;
                gameAddBoard.appendChild(cell);
            }
        }
    }

    function updateAddBoardCells() {
        const players = Game.getPlayers();
        const state = Game.getState();
        const cells = gameAddBoard.children;
        const currentPlayer = Game.getCurrentPlayer();
        const isFirst = Game.isFirstTurn();

        // Get disabled columns based on phase
        let disabledCols = null;
        if (state.phase === 'move-pion') {
            disabledCols = Game.getDisabledColumns(currentPlayer);
        }

        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const idx = r * BOARD_SIZE + c;
                const cell = cells[idx];
                cell.classList.remove('pion-here-1', 'pion-here-2', 'clickable', 'disabled');

                if (players[r].pionPos === c) {
                    cell.classList.add(r === 0 ? 'pion-here-1' : 'pion-here-2');
                }

                if (state.phase === 'move-pion') {
                    let isClickable = false;
                    if (isFirst && Game.getCoinWinner() === currentPlayer) {
                        isClickable = true;
                    } else if (r === currentPlayer) {
                        isClickable = true;
                    }

                    if (isClickable) {
                        // Check if this column is disabled (sum would exceed 18)
                        let isDisabled = false;
                        if (disabledCols) {
                            if (isFirst) {
                                // disabledCols is keyed by row: { 0: [...], 1: [...] }
                                isDisabled = disabledCols[r] && disabledCols[r].includes(c);
                            } else {
                                // disabledCols is a flat array for the current player's row
                                isDisabled = disabledCols.includes(c);
                            }
                        }

                        if (isDisabled) {
                            cell.classList.add('disabled');
                        } else {
                            cell.classList.add('clickable');
                        }
                    }
                }
            }
        }
    }

    function updateGameUI() {
        const state = Game.getState();
        const players = Game.getPlayers();
        const currentPlayer = Game.getCurrentPlayer();

        // Turn indicator
        turnIndicator.textContent = `Giliran: ${players[currentPlayer].name}`;
        turnIndicator.style.color = currentPlayer === 0 ? 'var(--blue-light)' : 'var(--red-light)';

        // Active player highlight
        p1Info.classList.toggle('active-turn', currentPlayer === 0);
        p2Info.classList.toggle('active-turn', currentPlayer === 1);

        // Scores
        p1Score.textContent = `${players[0].pionsOnBoard} pion`;
        p2Score.textContent = `${players[1].pionsOnBoard} pion`;

        // Sum
        const sum = Game.getSum();
        sumDisplay.textContent = sum !== null ? sum : '—';

        // Phase instruction
        if (state.phase === 'move-pion') {
            if (Game.isFirstTurn()) {
                phaseInstruction.textContent = `${players[currentPlayer].name}, gerakkan salah satu pion di Board Penjumlahan (giliran pertama: bisa gerakkan pion manapun)`;
            } else {
                phaseInstruction.textContent = `${players[currentPlayer].name}, gerakkan pion Anda di Board Penjumlahan`;
            }
        } else if (state.phase === 'place-board') {
            phaseInstruction.textContent = `Pilih cell bernilai ${sum} di Board Permainan`;
        }

        // Update board cells (no DOM recreation)
        updateAddBoardCells();
        updateBoardCells();
    }

    // ============================================
    // GAME INTERACTIONS
    // ============================================
    function handleAddBoardClick(row, col) {
        if (Game.getPhase() !== 'move-pion') return;
        if (Game.isAITurn()) return;

        // Guard: prevent selection of disabled columns (sum > 18)
        const currentPlayer = Game.getCurrentPlayer();
        const isFirst = Game.isFirstTurn();
        const disabledCols = Game.getDisabledColumns(currentPlayer);
        if (isFirst) {
            if (disabledCols[row] && disabledCols[row].includes(col)) return;
        } else {
            if (disabledCols.includes(col)) return;
        }

        const result = Game.movePion(row, col);
        if (!result) return;

        if (result.availableCells.length === 0) {
            // No available cells
            updateGameUI();
            highlightAvailableCells([]);
            drawMessage.textContent =
                `Tidak ada cell bernilai ${result.sum} yang tersedia. Giliran dilewati.`;
            drawOverlay.style.display = 'flex';
            return;
        }

        updateGameUI();
        highlightAvailableCells(result.availableCells);
    }

    function handleBoardClick(row, col) {
        if (Game.getPhase() !== 'place-board') return;
        if (Game.isAITurn()) return;

        const board = Game.getBoard();
        const sum = Game.getSum();
        if (board[row][col].value !== sum || board[row][col].owner !== null) return;

        const result = Game.placeOnBoard(row, col);
        if (!result) return;

        clearHighlights();

        if (result.win) {
            updateBoardCells();
            highlightWinCells(result.winCells);
            updateScores();
            showWinOverlay(result.winner);
            return;
        }

        updateGameUI();

        // AI's turn?
        if (Game.isAITurn()) {
            scheduleAI(doAITurn, 800);
        }
    }

    function highlightAvailableCells(cells) {
        // Clear existing highlights
        clearHighlights();

        cells.forEach(({ row, col }) => {
            const idx = row * BOARD_SIZE + col;
            const cellEl = gameBoard.children[idx];
            if (cellEl && !cellEl.classList.contains('taken-1') && !cellEl.classList.contains('taken-2')) {
                cellEl.classList.add('highlight');
            }
        });
    }

    function clearHighlights() {
        $$('.board-cell.highlight').forEach(el => el.classList.remove('highlight'));
    }

    function highlightWinCells(cells) {
        cells.forEach(({ row, col }) => {
            const idx = row * BOARD_SIZE + col;
            const cellEl = gameBoard.children[idx];
            if (cellEl) cellEl.classList.add('win-cell');
        });
    }

    function updateScores() {
        const players = Game.getPlayers();
        p1Score.textContent = `${players[0].pionsOnBoard} pion`;
        p2Score.textContent = `${players[1].pionsOnBoard} pion`;
    }

    function showWinOverlay(winnerIdx) {
        const players = Game.getPlayers();
        winTitle.textContent = '🎉 Selamat!';
        winMessage.textContent = `${players[winnerIdx].name} menang dengan 4 pion berjajar!`;
        winOverlay.style.display = 'flex';
    }

    // ============================================
    // AI TURN
    // ============================================
    function doAITurn() {
        if (!Game.isAITurn()) return;
        if (Game.getWinner() !== null) return;

        const move = AI.chooseMove();

        // First: move AI pion on addition board
        const moveResult = Game.movePion(1, move.pionCol);
        updateGameUI();

        if (!moveResult) return;

        if (move.noMoves || moveResult.availableCells.length === 0) {
            // No moves available
            highlightAvailableCells([]);
            drawMessage.textContent =
                `AI tidak bisa bergerak (tidak ada cell bernilai ${moveResult.sum} yang tersedia). Giliran dilewati.`;
            drawOverlay.style.display = 'flex';
            return;
        }

        highlightAvailableCells(moveResult.availableCells);

        // Then: place on board after a short delay
        scheduleAI(() => {
            const placeResult = Game.placeOnBoard(move.boardRow, move.boardCol);
            clearHighlights();

            if (!placeResult) {
                updateGameUI();
                return;
            }

            if (placeResult.win) {
                updateBoardCells();
                highlightWinCells(placeResult.winCells);
                updateScores();
                showWinOverlay(placeResult.winner);
                return;
            }

            // Add placed animation
            const idx = move.boardRow * BOARD_SIZE + move.boardCol;
            const cellEl = gameBoard.children[idx];
            if (cellEl) {
                cellEl.classList.add('placed-anim');
                setTimeout(() => cellEl.classList.remove('placed-anim'), 400);
            }

            updateGameUI();
        }, 1000);
    }

    // ============================================
    // BOOT
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
