/* ============================================
   DOLANAN MATEMATIKA - UI / DOM CONTROLLER
   ============================================ */
"use strict";

const UI = (() => {
    // ---- DOM References ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Screens
    const homeScreen = $('#home-screen');
    const menuScreen = $('#menu-screen');
    const coinScreen = $('#coin-screen');
    const placementScreen = $('#placement-screen');
    const gameScreen = $('#game-screen');

    // Home
    const tilePenjumlahan = $('#tile-penjumlahan');
    const tilePerkalian = $('#tile-perkalian');
    const backHomeBtn = $('#back-home-btn');

    // Menu
    const modeButtons = $$('#menu-screen .mode-btn');
    const timerButtons = $$('#menu-screen .timer-btn');
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
    const turnTimerEl = $('#turn-timer');
    const timerValueEl = $('#timer-value');
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
    const drawTitle = $('#draw-title');
    const drawMessage = $('#draw-message');
    const drawContinueBtn = $('#draw-continue-btn');
    const drawGameoverButtons = $('#draw-gameover-buttons');
    const drawPlayAgainBtn = $('#draw-play-again-btn');
    const drawBackMenuBtn = $('#draw-back-menu-btn');

    let selectedMode = 'pvp';
    let selectedTimeLimit = 30;
    let aiTimerIds = [];
    let turnTimerId = null;
    let turnTimeRemaining = 0;
    let isAddActive = false; // Track if addition game is the active game

    function scheduleAI(fn, delay) {
        const id = setTimeout(fn, delay);
        aiTimerIds.push(id);
        return id;
    }

    function clearAllAITimers() {
        aiTimerIds.forEach(id => clearTimeout(id));
        aiTimerIds = [];
    }

    // ---- Turn Timer ----
    function startTurnTimer() {
        stopTurnTimer();
        const limit = Game.getTimeLimit();
        if (!limit || limit <= 0) {
            turnTimerEl.style.display = 'none';
            return;
        }
        turnTimeRemaining = limit;
        turnTimerEl.style.display = 'block';
        timerValueEl.textContent = turnTimeRemaining;
        turnTimerEl.classList.remove('timer-warning');
        turnTimerId = setInterval(() => {
            turnTimeRemaining--;
            timerValueEl.textContent = turnTimeRemaining;
            if (turnTimeRemaining <= 5) {
                turnTimerEl.classList.add('timer-warning');
                if (turnTimeRemaining <= 3) {
                    SFX.timerUrgent();
                } else {
                    SFX.timerTick();
                }
            }
            if (turnTimeRemaining <= 0) {
                onTurnTimeout();
            }
        }, 1000);
    }

    function stopTurnTimer() {
        if (turnTimerId !== null) {
            clearInterval(turnTimerId);
            turnTimerId = null;
        }
        turnTimerEl.classList.remove('timer-warning');
    }

    function onTurnTimeout() {
        stopTurnTimer();
        if (Game.getWinner() !== null) return;

        const phase = Game.getPhase();
        if (phase === 'move-pion' || phase === 'place-board') {
            // Clear any pending AI timers in case AI was mid-turn
            clearAllAITimers();
            clearHighlights();

            // Player who ran out of time automatically loses
            const loserIdx = Game.getCurrentPlayer();
            showTimeoutLoseOverlay(loserIdx);
        }
    }

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ============================================
    // INIT / EVENT LISTENERS
    // ============================================
    function init() {
        // ---- Shared UI: How to Play, Sound Toggle, Floating Help ----
        const htpOverlay = $('#how-to-play-overlay');
        const htpCloseBtn = $('#htp-close-btn');
        const htpBtn = $('#how-to-play-btn');
        const floatingHelpBtn = $('#floating-help-btn');
        const soundToggleBtn = $('#sound-toggle-btn');

        // Update sound button icon on load
        if (soundToggleBtn) {
            soundToggleBtn.textContent = SFX.isMuted() ? '🔇' : '🔊';
            soundToggleBtn.addEventListener('click', () => {
                SFX.ensureContext();
                const nowMuted = SFX.toggleMute();
                soundToggleBtn.textContent = nowMuted ? '🔇' : '🔊';
            });
        }

        if (htpBtn) {
            htpBtn.addEventListener('click', () => {
                SFX.ensureContext();
                htpOverlay.style.display = 'flex';
            });
        }
        if (htpCloseBtn) {
            htpCloseBtn.addEventListener('click', () => {
                htpOverlay.style.display = 'none';
            });
        }
        // Close HTP overlay by clicking backdrop
        if (htpOverlay) {
            htpOverlay.addEventListener('click', (e) => {
                if (e.target === htpOverlay) htpOverlay.style.display = 'none';
            });
        }
        if (floatingHelpBtn) {
            floatingHelpBtn.addEventListener('click', () => {
                htpOverlay.style.display = 'flex';
            });
        }

        // Home screen tiles
        tilePenjumlahan.addEventListener('click', () => {
            isAddActive = true;
            showScreen('menu');
        });

        // Back to home
        backHomeBtn.addEventListener('click', () => {
            isAddActive = false;
            showScreen('home');
        });

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

        // Timer buttons
        timerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                timerButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedTimeLimit = parseInt(btn.dataset.time, 10);
            });
        });

        // Coin buttons (scoped to penjumlahan coin screen)
        $$('#coin-screen .coin-btn').forEach(btn => {
            btn.addEventListener('click', () => handleCoinChoice(btn.dataset.choice));
        });

        // Coin continue
        coinContinueBtn.addEventListener('click', goToPlacement);

        // Placement confirm
        placementConfirmBtn.addEventListener('click', confirmPlacement);

        // Win overlay (gated by isAddActive — shared with perkalian)
        playAgainBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            winOverlay.style.display = 'none';
            stopTurnTimer();
            startGame();
        });
        backMenuBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            winOverlay.style.display = 'none';
            stopTurnTimer();
            showScreen('menu');
        });

        // Draw overlay — "Lanjutkan" only shown for normal skip (no longer used)
        drawContinueBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            drawOverlay.style.display = 'none';
            drawContinueBtn.style.display = '';
            drawGameoverButtons.style.display = 'none';
            Game.skipTurn();
            updateGameUI();
            startTurnTimer();
            if (Game.isAITurn()) {
                scheduleAI(doAITurn, 800);
            }
        });

        // Draw overlay — game over buttons (auto-lose or draw)
        drawPlayAgainBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            drawOverlay.style.display = 'none';
            drawContinueBtn.style.display = '';
            drawGameoverButtons.style.display = 'none';
            stopTurnTimer();
            startGame();
        });
        drawBackMenuBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            drawOverlay.style.display = 'none';
            drawContinueBtn.style.display = '';
            drawGameoverButtons.style.display = 'none';
            stopTurnTimer();
            showScreen('menu');
        });

        // Restore saved player names
        try {
            const saved1 = localStorage.getItem('dolanan_p1_name');
            const saved2 = localStorage.getItem('dolanan_p2_name');
            if (saved1) player1Input.value = saved1;
            if (saved2) player2Input.value = saved2;
        } catch (e) { /* ignore */ }

        // Warn before leaving mid-game
        window.addEventListener('beforeunload', (e) => {
            if (isAddActive && Game.getPhase() !== 'menu' && Game.getWinner() === null) {
                e.preventDefault();
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
            // Block human clicks when AI won the coin toss and is placing
            if (Game.isAIMode() && Game.getCoinWinner() === 1) return;
            handlePlacementClick(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        });
    }

    // ============================================
    // SCREEN MANAGEMENT
    // ============================================
    function showScreen(name) {
        $$('.screen').forEach(s => s.classList.remove('active'));
        const floatingHelp = document.getElementById('floating-help-btn');
        switch(name) {
            case 'home':
                homeScreen.classList.add('active');
                document.title = 'Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'none';
                break;
            case 'menu':
                menuScreen.classList.add('active');
                document.title = 'Rumah Penjumlahan - Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'none';
                break;
            case 'coin':
                coinScreen.classList.add('active');
                document.title = 'Rumah Penjumlahan - Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'flex';
                break;
            case 'placement':
                placementScreen.classList.add('active');
                document.title = 'Rumah Penjumlahan - Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'flex';
                break;
            case 'game':
                gameScreen.classList.add('active');
                document.title = 'Rumah Penjumlahan - Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'flex';
                break;
        }
    }

    // ============================================
    // START GAME
    // ============================================
    function startGame() {
        clearAllAITimers();
        stopTurnTimer();
        const p1Name = player1Input.value.trim() || 'Pemain 1';
        const p2Name = selectedMode === 'ai' ? 'AI' : (player2Input.value.trim() || 'Pemain 2');

        // Save names for next session
        try {
            localStorage.setItem('dolanan_p1_name', player1Input.value.trim());
            localStorage.setItem('dolanan_p2_name', player2Input.value.trim());
        } catch (e) { /* ignore */ }

        Game.init(selectedMode, p1Name, p2Name, selectedTimeLimit);

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

        SFX.coinFlip();

        setTimeout(() => {
            SFX.coinResult();
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
                    const isAIPlacing = Game.isAIMode() && Game.getCoinWinner() === 1;
                    if (!isAIPlacing) {
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

        // Start turn timer for the first board placement
        startTurnTimer();

        if (availableCells.length > 0) {
            highlightAvailableCells(availableCells);
        } else {
            // No cells for this sum after initial placement
            // Coin winner placed both pions, resulting sum unavailable
            const autoResult = Game.checkAutoGameOver(current);
            if (autoResult.autoLose) {
                showAutoLoseOverlay(current, sum);
            } else {
                showDrawOverlay();
            }
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
            startTurnTimer();
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
        startTurnTimer();
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
                cell.removeAttribute('title');

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
                            cell.title = 'Kolom ini tidak bisa dipilih karena jumlahnya lebih dari 18';
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

        SFX.click();

        if (result.availableCells.length === 0) {
            // No available cells — check if player had a safe move
            updateGameUI();
            highlightAvailableCells([]);
            const autoResult = Game.checkAutoGameOver(currentPlayer);
            if (autoResult.autoLose) {
                showAutoLoseOverlay(currentPlayer, result.sum);
            } else {
                showDrawOverlay();
            }
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
        SFX.place();

        if (result.win) {
            updateBoardCells();
            highlightWinCells(result.winCells);
            updateScores();
            showWinOverlay(result.winner);
            return;
        }

        updateGameUI();
        startTurnTimer();

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
        stopTurnTimer();
        SFX.win();
        const players = Game.getPlayers();
        winTitle.textContent = '🎉 Selamat!';
        winMessage.textContent = `${players[winnerIdx].name} menang dengan 4 pion berjajar!`;
        winOverlay.style.display = 'flex';
    }

    // Show timeout lose overlay (player ran out of time)
    function showTimeoutLoseOverlay(loserIdx) {
        stopTurnTimer();
        SFX.error();
        const players = Game.getPlayers();
        const winner = 1 - loserIdx;
        Game.setWinner(winner);
        drawTitle.textContent = '⏰ Waktu Habis!';
        drawMessage.textContent =
            `${players[loserIdx].name} kehabisan waktu. ` +
            `${players[winner].name} menang otomatis!`;
        drawContinueBtn.style.display = 'none';
        drawGameoverButtons.style.display = 'flex';
        drawOverlay.style.display = 'flex';
    }

    // Show auto-lose overlay (opponent wins because player chose a bad number)
    function showAutoLoseOverlay(loserIdx, sum) {
        stopTurnTimer();
        SFX.error();
        const players = Game.getPlayers();
        const winner = 1 - loserIdx;
        Game.setWinner(winner);
        drawTitle.textContent = '🚫 Game Over!';
        drawMessage.textContent =
            `${players[loserIdx].name} memilih angka yang menghasilkan jumlah ${sum}, ` +
            `yang tidak tersedia di Board Permainan. ` +
            `${players[winner].name} menang otomatis!`;
        drawContinueBtn.style.display = 'none';
        drawGameoverButtons.style.display = 'flex';
        drawOverlay.style.display = 'flex';
    }

    // Show draw overlay (no safe moves exist for any position)
    function showDrawOverlay() {
        stopTurnTimer();
        SFX.draw();
        Game.setDraw();
        drawTitle.textContent = '🤝 Seri!';
        drawMessage.textContent =
            'Tidak ada langkah tersisa yang menghasilkan angka yang tersedia di Board Permainan. ' +
            'Permainan berakhir seri.';
        drawContinueBtn.style.display = 'none';
        drawGameoverButtons.style.display = 'flex';
        drawOverlay.style.display = 'flex';
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
            // No moves available — check if AI had a safe move
            highlightAvailableCells([]);
            const autoResult = Game.checkAutoGameOver(1);
            if (autoResult.autoLose) {
                showAutoLoseOverlay(1, moveResult.sum);
            } else {
                showDrawOverlay();
            }
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
            startTurnTimer();
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

    return { init, isAddActive: () => isAddActive, setAddActive: (val) => { isAddActive = val; } };
})();
