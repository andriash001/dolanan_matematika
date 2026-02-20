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
    const timerButtons = $$('#menu-screen .timer-btn[data-time]');
    const difficultyButtons = $$('#menu-screen .difficulty-btn');
    const difficultyGroup = $('#difficulty-selection');
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
    const coinBackHomeBtn = $('#coin-back-home-btn');

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
    const timerBarEl = $('#timer-bar');
    const timerBarTrackEl = $('#timer-bar-track');
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

    // Series score & share
    const winSeriesScore = $('#win-series-score');
    const drawSeriesScore = $('#draw-series-score');
    const drawShareSection = $('#draw-share-section');
    const clipboardToast = $('#clipboard-toast');

    // Win pattern grid
    const winPatternGrid = $('#win-pattern-grid');
    const winPatternLabel = $('#win-pattern-label');

    let currentShareText = ''; // share text for current game result

    let selectedMode = 'pvp';
    let selectedTimeLimit = 30;
    let selectedDifficulty = 'normal';
    let aiTimerIds = [];
    let turnTimerId = null;
    let turnTimeRemaining = 0;
    let coinResultTimerId = null;
    let isAddActive = false; // Track if addition game is the active game

    // ---- Round tracking for summary & rematch ----
    let roundStartTime = null;
    let roundId = 0;
    let lastMatchConfig = null;

    function scheduleAI(fn, delay) {
        const scheduledRoundId = roundId;
        const id = setTimeout(() => {
            if (scheduledRoundId !== roundId) return;
            fn();
        }, delay);
        aiTimerIds.push(id);
        return id;
    }

    function clearAllAITimers() {
        aiTimerIds.forEach(id => clearTimeout(id));
        aiTimerIds = [];
    }

    // ---- Turn Timer ----
    function updateTimerBarColor(pct) {
        if (pct > 50) {
            timerBarEl.style.backgroundColor = '#22c55e';
        } else if (pct > 20) {
            timerBarEl.style.backgroundColor = '#eab308';
        } else {
            timerBarEl.style.backgroundColor = '#ef4444';
        }
    }

    function startTurnTimer() {
        stopTurnTimer();
        const limit = Game.getTimeLimit();
        if (!limit || limit <= 0) {
            turnTimerEl.style.display = 'none';
            timerBarTrackEl.style.display = 'none';
            return;
        }
        turnTimeRemaining = limit;
        turnTimerEl.style.display = 'block';
        timerBarTrackEl.style.display = 'block';
        timerValueEl.textContent = turnTimeRemaining;
        turnTimerEl.classList.remove('timer-warning');

        // Reset bar to full instantly, then enable smooth transition
        timerBarEl.style.transition = 'none';
        timerBarEl.style.width = '100%';
        updateTimerBarColor(100);
        timerBarEl.offsetWidth; // force reflow
        timerBarEl.style.transition = 'width 1s linear, background-color 1s linear';

        turnTimerId = setInterval(() => {
            turnTimeRemaining--;
            timerValueEl.textContent = turnTimeRemaining;
            const pct = (turnTimeRemaining / limit) * 100;
            timerBarEl.style.width = pct + '%';
            updateTimerBarColor(pct);
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
        timerBarEl.style.transition = 'none';
        timerBarEl.style.width = '100%';
        updateTimerBarColor(100);
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

        // HTP language toggle (ID / EN)
        const htpLangBtns = document.querySelectorAll('.htp-lang-btn');
        const htpLangContents = document.querySelectorAll('.htp-lang-content');
        htpLangBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                htpLangBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                htpLangContents.forEach(c => {
                    c.style.display = c.dataset.lang === lang ? '' : 'none';
                });
            });
        });

        // Home screen tiles
        tilePenjumlahan.addEventListener('click', () => {
            isAddActive = true;
            showScreen('menu');
        });

        // Back to home
        backHomeBtn.addEventListener('click', () => {
            isAddActive = false;
            Game.resetSeriesScore();
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
                    difficultyGroup.style.display = 'block';
                } else {
                    player2Group.style.display = 'block';
                    difficultyGroup.style.display = 'none';
                }
            });
        });

        // Difficulty buttons
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                difficultyButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedDifficulty = btn.dataset.difficulty;
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
        coinBackHomeBtn.addEventListener('click', () => {
            clearAllAITimers();
            stopTurnTimer();
            if (coinResultTimerId !== null) {
                clearTimeout(coinResultTimerId);
                coinResultTimerId = null;
            }
            isAddActive = false;
            Game.resetSeriesScore();
            showScreen('home');
        });

        // Placement confirm
        placementConfirmBtn.addEventListener('click', confirmPlacement);

        // Win overlay (gated by isAddActive — shared with perkalian)
        playAgainBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            winOverlay.style.display = 'none';
            winPatternGrid.innerHTML = '';
            winPatternLabel.style.display = 'none';
            stopTurnTimer();
            startRematch();
        });
        backMenuBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            winOverlay.style.display = 'none';
            winPatternGrid.innerHTML = '';
            winPatternLabel.style.display = 'none';
            stopTurnTimer();
            Game.resetSeriesScore();
            showScreen('menu');
        });

        // Draw overlay — "Lanjutkan" only shown for normal skip (no longer used)
        drawContinueBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            drawOverlay.style.display = 'none';
            drawContinueBtn.style.display = '';
            drawGameoverButtons.style.display = 'none';
            drawSeriesScore.style.display = 'none';
            drawShareSection.style.display = 'none';
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
            drawSeriesScore.style.display = 'none';
            drawShareSection.style.display = 'none';
            stopTurnTimer();
            startRematch();
        });
        drawBackMenuBtn.addEventListener('click', () => {
            if (!isAddActive) return;
            drawOverlay.style.display = 'none';
            drawContinueBtn.style.display = '';
            drawGameoverButtons.style.display = 'none';
            drawSeriesScore.style.display = 'none';
            drawShareSection.style.display = 'none';
            stopTurnTimer();
            Game.resetSeriesScore();
            showScreen('menu');
        });

        // Share buttons (win overlay)
        $('#share-x-btn').addEventListener('click', () => { if (isAddActive) shareToX(); });
        $('#share-threads-btn').addEventListener('click', () => { if (isAddActive) shareToThreads(); });
        $('#share-ig-btn').addEventListener('click', () => { if (isAddActive) shareToIG(); });
        // Share buttons (draw overlay)
        $('#draw-share-x-btn').addEventListener('click', () => { if (isAddActive) shareToX(); });
        $('#draw-share-threads-btn').addEventListener('click', () => { if (isAddActive) shareToThreads(); });
        $('#draw-share-ig-btn').addEventListener('click', () => { if (isAddActive) shareToIG(); });

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

    // ---- Summary helper ----
    function populateSummaryMeta(resultType, reasonText) {
        const summaryMeta = resultType === 'win' ? $('#win-summary-meta') : $('#draw-summary-meta');
        if (!summaryMeta) return;
        
        const state = Game.getState();
        const durationSec = roundStartTime ? Math.round((Date.now() - roundStartTime) / 1000) : 0;
        void reasonText;
        
        // Build summary rows
        const rows = [];
        if (selectedMode === 'ai') {
            rows.push(`<div class="summary-row"><span>Level AI</span><span class="summary-value">${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}</span></div>`);
        }
        rows.push(`<div class="summary-row"><span>Jumlah Langkah</span><span class="summary-value">${state.moveHistory ? state.moveHistory.length : 0}</span></div>`);
        rows.push(`<div class="summary-row"><span>Durasi</span><span class="summary-value">${durationSec}s</span></div>`);
        
        summaryMeta.innerHTML = rows.join('');
    }

    // ============================================
    // START GAME
    // ============================================
    function startGame() {
        clearAllAITimers();
        stopTurnTimer();
        
        // ---- Round tracking & config snapshot ----
        roundId++;
        roundStartTime = Date.now();
        lastMatchConfig = {
            mode: selectedMode,
            difficulty: selectedDifficulty,
            timeLimit: selectedTimeLimit,
            isMultGame: false
        };
        
        const p1Name = player1Input.value.trim() || 'Pemain 1';
        const p2Name = selectedMode === 'ai' ? 'AI' : (player2Input.value.trim() || 'Pemain 2');

        // Save names for next session
        try {
            localStorage.setItem('dolanan_p1_name', player1Input.value.trim());
            localStorage.setItem('dolanan_p2_name', player2Input.value.trim());
        } catch (e) { /* ignore */ }

        Game.init(selectedMode, p1Name, p2Name, selectedTimeLimit, selectedDifficulty);

        // Reset coin UI
        if (coinResultTimerId !== null) {
            clearTimeout(coinResultTimerId);
            coinResultTimerId = null;
        }
        coinEl.className = 'coin';
        coinChoices.style.display = 'flex';
        coinResult.style.display = 'none';
        coinInstruction.textContent = `${p1Name}, pilih sisi koin:`;

        showScreen('coin');
    }

    function startRematch() {
        // Use last match settings if available, otherwise defaults
        if (lastMatchConfig) {
            selectedMode = lastMatchConfig.mode;
            selectedDifficulty = lastMatchConfig.difficulty;
            selectedTimeLimit = lastMatchConfig.timeLimit;
        }
        startGame();
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

        if (coinResultTimerId !== null) {
            clearTimeout(coinResultTimerId);
        }
        const scheduledRoundId = roundId;
        coinResultTimerId = setTimeout(() => {
            if (scheduledRoundId !== roundId) return;
            SFX.coinResult();
            const players = Game.getPlayers();
            const winnerName = escapeHTML(players[winner].name);
            const p1Display = escapeHTML(players[0].name);
            const resultLabel = result === 'head' ? 'Kepala' : 'Ekor';

            coinResultText.innerHTML = `Hasil: <strong>${resultLabel}</strong><br>` +
                `${p1Display} memilih: <strong>${choice === 'head' ? 'Kepala' : 'Ekor'}</strong><br><br>` +
                `🎉 <strong>${winnerName}</strong> menang coin toss!<br>` +
                `${winnerName} akan menempatkan kedua pion terlebih dahulu.`;

            coinResult.style.display = 'block';
            coinResultTimerId = null;
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
        let col1;
        try {
            col1 = (AI && typeof AI.chooseInitialPlacement === 'function')
                ? AI.chooseInitialPlacement()
                : fallbackChooseInitialPlacement();
        } catch (e) {
            col1 = fallbackChooseInitialPlacement();
        }
        // Place on row 1 (AI's row) first, or row 0
        const unplaced1 = Game.getUnplacedRow();
        let firstRow = 1; // AI prefers its own row first
        if (unplaced1 !== 'both' && unplaced1 !== 1) firstRow = 0;

        handlePlacementClick(firstRow, col1);

        scheduleAI(() => {
            // AI places second pion, passing first pion's column for constraint
            let col2;
            try {
                col2 = (AI && typeof AI.chooseInitialPlacement === 'function')
                    ? AI.chooseInitialPlacement(col1)
                    : fallbackChooseInitialPlacement(col1);
            } catch (e) {
                col2 = fallbackChooseInitialPlacement(col1);
            }
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

        let bestCell;
        try {
            if (AI && typeof AI.chooseFirstBoardPlacement === 'function') {
                bestCell = AI.chooseFirstBoardPlacement(availableCells);
            }
        } catch (e) {
            bestCell = null;
        }
        if (!isCellInList(bestCell, availableCells)) {
            bestCell = fallbackChooseFirstBoardPlacement(availableCells);
        }

        let placeResult = Game.placeOnBoard(bestCell.row, bestCell.col);
        if (!placeResult) {
            const fallbackCell = fallbackChooseFirstBoardPlacement(availableCells);
            placeResult = Game.placeOnBoard(fallbackCell.row, fallbackCell.col);
        }
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
        gameBoard.querySelectorAll('.board-cell.highlight').forEach(el => el.classList.remove('highlight'));
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
        renderWinPatternGrid(Game.getBoard(), Game.getWinCells(), BOARD_SIZE);
        updateSeriesScoreDisplay(winSeriesScore, players);
        populateSummaryMeta('win', 'win');
        currentShareText = buildShareText(players);
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
        updateSeriesScoreDisplay(drawSeriesScore, players);
        populateSummaryMeta('draw', 'timeout');
        drawShareSection.style.display = '';
        currentShareText = buildShareText(players);
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
        drawMessage.textContent = sum !== null
            ? `${players[loserIdx].name} memilih angka yang menghasilkan jumlah ${sum}, ` +
              `yang tidak tersedia di Board Permainan. ` +
              `${players[winner].name} menang otomatis!`
            : `${players[loserIdx].name} tidak memiliki langkah valid. ` +
              `${players[winner].name} menang otomatis!`;
        drawContinueBtn.style.display = 'none';
        drawGameoverButtons.style.display = 'flex';
        updateSeriesScoreDisplay(drawSeriesScore, players);
        populateSummaryMeta('draw', 'auto-lose');
        drawShareSection.style.display = '';
        currentShareText = buildShareText(players);
        drawOverlay.style.display = 'flex';
    }

    // Show draw overlay (no safe moves exist for any position)
    function showDrawOverlay() {
        stopTurnTimer();
        SFX.draw();
        Game.setDraw();
        const players = Game.getPlayers();
        drawTitle.textContent = '🤝 Seri!';
        drawMessage.textContent =
            'Tidak ada langkah tersisa yang menghasilkan angka yang tersedia di Board Permainan. ' +
            'Permainan berakhir seri.';
        drawContinueBtn.style.display = 'none';
        drawGameoverButtons.style.display = 'flex';
        updateSeriesScoreDisplay(drawSeriesScore, players);
        populateSummaryMeta('draw', 'draw');
        drawShareSection.style.display = '';
        currentShareText = buildShareText(players);
        drawOverlay.style.display = 'flex';
    }

    // ============================================
    // SERIES SCORE & SHARE
    // ============================================
    function updateSeriesScoreDisplay(el, players) {
        const series = Game.getSeriesScore();
        el.innerHTML =
            `<span class="score-name score-name-blue">${escapeHTML(players[0].name)}</span>` +
            `<span class="score-box score-box-blue">${series.scores[0]}</span>` +
            `<span class="score-dash">–</span>` +
            `<span class="score-box score-box-red">${series.scores[1]}</span>` +
            `<span class="score-name score-name-red">${escapeHTML(players[1].name)}</span>`;
        el.style.display = '';
    }

    // ---- Win Pattern Grid helpers ----
    function buildWinPatternData(board, winCells, boardSize) {
        if (!winCells || winCells.length === 0) return null;
        let minR = boardSize, maxR = 0, minC = boardSize, maxC = 0;
        for (const { row, col } of winCells) {
            if (row < minR) minR = row;
            if (row > maxR) maxR = row;
            if (col < minC) minC = col;
            if (col > maxC) maxC = col;
        }
        // Expand by 1 cell padding, clamped
        const startRow = Math.max(0, minR - 1);
        const endRow = Math.min(boardSize - 1, maxR + 1);
        const startCol = Math.max(0, minC - 1);
        const endCol = Math.min(boardSize - 1, maxC + 1);

        const winSet = new Set(winCells.map(c => `${c.row},${c.col}`));
        const grid = [];
        for (let r = startRow; r <= endRow; r++) {
            const row = [];
            for (let c = startCol; c <= endCol; c++) {
                row.push({
                    value: board[r][c].value,
                    owner: board[r][c].owner,
                    isWinCell: winSet.has(`${r},${c}`)
                });
            }
            grid.push(row);
        }
        return { startRow, startCol, endRow, endCol, grid };
    }

    function renderWinPatternGrid(board, winCells, boardSize) {
        winPatternGrid.innerHTML = '';
        const data = buildWinPatternData(board, winCells, boardSize);
        if (!data) {
            winPatternLabel.style.display = 'none';
            return;
        }
        winPatternLabel.style.display = '';
        const cols = data.grid[0].length;
        winPatternGrid.style.gridTemplateColumns = `repeat(${cols}, 34px)`;
        for (const row of data.grid) {
            for (const cell of row) {
                const el = document.createElement('div');
                el.className = 'win-pat-cell';
                if (cell.owner === 0) el.classList.add('win-pat-blue');
                else if (cell.owner === 1) el.classList.add('win-pat-red');
                else el.classList.add('win-pat-empty');
                if (cell.isWinCell) el.classList.add('win-pat-highlight');
                el.textContent = cell.value;
                winPatternGrid.appendChild(el);
            }
        }
    }

    function buildWinPatternEmoji(board, winCells, boardSize) {
        const data = buildWinPatternData(board, winCells, boardSize);
        if (!data) return '';
        let lines = [];
        for (const row of data.grid) {
            let line = '';
            for (const cell of row) {
                if (cell.owner === 0) line += '🟦';
                else if (cell.owner === 1) line += '🟥';
                else line += '⬜';
            }
            lines.push(line);
        }
        return '\n📍 Pola Kemenangan:\n' + lines.join('\n');
    }

    function buildShareText(players) {
        const series = Game.getSeriesScore();
        const winner = Game.getWinner();
        let result = '';
        if (winner === -1) {
            result = '🤝 Seri!';
        } else if (winner !== null) {
            result = `🏆 ${players[winner].name} menang!`;
        }
        let patternText = '';
        if (winner !== null && winner !== -1) {
            patternText = buildWinPatternEmoji(Game.getBoard(), Game.getWinCells(), BOARD_SIZE);
        }
        return `🎮 Dolanan Matematika — Rumah Penjumlahan\n` +
            `${result}\n` +
            `📊 Skor: ${players[0].name} ${series.scores[0]} – ${series.scores[1]} ${players[1].name}` +
            `${patternText}\n` +
            `\nMain juga di dolananmatematika.com!`;
    }

    function shareToX() {
        SFX.click();
        const text = encodeURIComponent(currentShareText);
        window.open(`https://x.com/intent/tweet?text=${text}`, '_blank', 'noopener');
    }

    function shareToThreads() {
        SFX.click();
        const text = encodeURIComponent(currentShareText);
        window.open(`https://www.threads.net/intent/post?text=${text}`, '_blank', 'noopener');
    }

    function shareToIG() {
        SFX.click();
        const text = currentShareText;
        navigator.clipboard.writeText(text).then(() => {
            clipboardToast.classList.add('show');
            setTimeout(() => clipboardToast.classList.remove('show'), 2500);
        }).catch(() => {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            clipboardToast.classList.add('show');
            setTimeout(() => clipboardToast.classList.remove('show'), 2500);
        });
    }

    // ============================================
    // AI TURN
    // ============================================
    function doAITurn() {
        if (!Game.isAITurn()) return;
        if (Game.getWinner() !== null) return;

        let move;
        try {
            move = (AI && typeof AI.chooseMove === 'function') ? AI.chooseMove() : fallbackChooseMove();
        } catch (e) {
            move = fallbackChooseMove();
        }
        if (!move || typeof move.pionCol !== 'number') {
            move = fallbackChooseMove();
        }

        // First: move AI pion on addition board
        const moveResult = Game.movePion(1, move.pionCol);
        updateGameUI();

        if (!moveResult) {
            // movePion failed (e.g. same position) — still need to end the game
            const autoResult = Game.checkAutoGameOver(1);
            if (autoResult.autoLose) {
                showAutoLoseOverlay(1, null);
            } else {
                showDrawOverlay();
            }
            return;
        }

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
            let placeResult = Game.placeOnBoard(move.boardRow, move.boardCol);
            if (!placeResult && moveResult.availableCells && moveResult.availableCells.length > 0) {
                const fallbackCell = fallbackChooseFirstBoardPlacement(moveResult.availableCells);
                placeResult = Game.placeOnBoard(fallbackCell.row, fallbackCell.col);
            }
            clearHighlights();

            if (!placeResult) {
                Game.skipTurn();
                updateGameUI();
                startTurnTimer();
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

    function isCellInList(cell, list) {
        if (!cell || typeof cell.row !== 'number' || typeof cell.col !== 'number') return false;
        return list.some(c => c.row === cell.row && c.col === cell.col);
    }

    function fallbackChooseFirstBoardPlacement(availableCells) {
        let bestScore = -Infinity;
        let bestCell = availableCells[0];
        for (const cell of availableCells) {
            const centerDist = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
            const score = (10 - centerDist) + Math.random() * 5;
            if (score > bestScore) {
                bestScore = score;
                bestCell = cell;
            }
        }
        return bestCell;
    }

    function fallbackChooseInitialPlacement(firstPionCol) {
        const preferred = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
        const disabledCols = (firstPionCol !== undefined && firstPionCol !== null)
            ? Game.getDisabledColumnsForPlacement(firstPionCol)
            : [];
        const allowed = preferred.filter(c => !disabledCols.includes(c));
        return allowed.length > 0 ? allowed[0] : 0;
    }

    function fallbackChooseMove() {
        const state = Game.getState();
        const aiIdx = 1;
        const humanIdx = 0;
        const aiCurrentPos = state.players[aiIdx].pionPos;
        const humanPos = state.players[humanIdx].pionPos;
        const candidates = [];

        for (let pos = 0; pos < BOARD_SIZE; pos++) {
            if (pos === aiCurrentPos) continue;
            const sum = (humanPos + 1) + (pos + 1);
            if (sum > MAX_CELL_VALUE) continue;
            const cells = Game.getAvailableCellsForSum(sum);
            for (const cell of cells) {
                const centerDist = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
                const score = (10 - centerDist) + Math.random() * 5;
                candidates.push({ pionCol: pos, boardRow: cell.row, boardCol: cell.col, score });
            }
        }

        if (candidates.length === 0) {
            return {
                pionCol: (aiCurrentPos + 1) % BOARD_SIZE,
                boardRow: -1,
                boardCol: -1,
                noMoves: true
            };
        }

        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
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
