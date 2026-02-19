/* ============================================
   DOLANAN MATEMATIKA - UI / DOM CONTROLLER (PERKALIAN)
   ============================================ */
"use strict";

const UIMult = (() => {
    // ---- DOM References ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Screens
    const homeScreen = $('#home-screen');
    const menuScreen = $('#menu-screen-mult');
    const coinScreen = $('#coin-screen-mult');
    const placementScreen = $('#placement-screen-mult');
    const gameScreen = $('#game-screen-mult');

    // Home
    const tilePerkalian = $('#tile-perkalian');
    const backHomeBtn = $('#back-home-btn-mult');

    // Menu
    const modeButtons = $$('#menu-screen-mult .mode-btn');
    const timerButtons = $$('#menu-screen-mult .timer-btn[data-time]');
    const difficultyButtons = $$('#menu-screen-mult .difficulty-btn');
    const difficultyGroup = $('#difficulty-selection-mult');
    const player1Input = $('#player1-name-mult');
    const player2Input = $('#player2-name-mult');
    const player2Group = $('#player2-input-mult');
    const startBtn = $('#start-btn-mult');

    // Coin
    const coinEl = $('#coin-mult');
    const coinChoices = $('#coin-choices-mult');
    const coinInstruction = $('#coin-instruction-mult');
    const coinResult = $('#coin-result-mult');
    const coinResultText = $('#coin-result-text-mult');
    const coinContinueBtn = $('#coin-continue-btn-mult');
    const coinBackHomeBtn = $('#coin-back-home-btn-mult');

    // Placement
    const placementTitle = $('#placement-title-mult');
    const placementInstruction = $('#placement-instruction-mult');
    const placementMultBoard = $('#placement-multiplication-board');
    const placementConfirmBtn = $('#placement-confirm-btn-mult');

    // Game
    const gameBoard = $('#game-board-mult');
    const gameMultBoard = $('#game-multiplication-board');
    const turnIndicator = $('#turn-indicator-mult');
    const turnTimerEl = $('#turn-timer-mult');
    const timerValueEl = $('#timer-value-mult');
    const timerBarEl = $('#timer-bar-mult');
    const timerBarTrackEl = $('#timer-bar-track-mult');
    const productDisplay = $('#product-value-mult');
    const phaseInstruction = $('#phase-instruction-mult');
    const p1NameDisplay = $('#p1-name-display-mult');
    const p2NameDisplay = $('#p2-name-display-mult');
    const p1Score = $('#p1-score-mult');
    const p2Score = $('#p2-score-mult');
    const p1Info = $('#player1-info-mult');
    const p2Info = $('#player2-info-mult');

    // Overlays (shared with penjumlahan)
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
    let isMultActive = false; // Track if multiplication game is the active game

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
        const limit = GameMult.getTimeLimit();
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
        if (GameMult.getWinner() !== null) return;

        const phase = GameMult.getPhase();
        if (phase === 'move-pion' || phase === 'place-board') {
            clearAllAITimers();
            clearHighlights();

            // Player who ran out of time automatically loses
            const loserIdx = GameMult.getCurrentPlayer();
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
        // Home screen tile
        tilePerkalian.addEventListener('click', () => {
            isMultActive = true;
            showScreen('menu-mult');
        });

        // Back to home
        backHomeBtn.addEventListener('click', () => {
            isMultActive = false;
            GameMult.resetSeriesScore();
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

        // Coin buttons
        $$('#coin-screen-mult .coin-btn').forEach(btn => {
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
            isMultActive = false;
            GameMult.resetSeriesScore();
            showScreen('home');
        });

        // Placement confirm
        placementConfirmBtn.addEventListener('click', confirmPlacement);

        // Win overlay — handle when mult game is active
        playAgainBtn.addEventListener('click', () => {
            if (!isMultActive) return;
            winOverlay.style.display = 'none';
            winPatternGrid.innerHTML = '';
            winPatternLabel.style.display = 'none';
            stopTurnTimer();
            startRematch();
        });
        backMenuBtn.addEventListener('click', () => {
            if (!isMultActive) return;
            winOverlay.style.display = 'none';
            winPatternGrid.innerHTML = '';
            winPatternLabel.style.display = 'none';
            stopTurnTimer();
            GameMult.resetSeriesScore();
            showScreen('menu-mult');
        });

        // Draw overlay
        drawContinueBtn.addEventListener('click', () => {
            if (!isMultActive) return;
            drawOverlay.style.display = 'none';
            drawContinueBtn.style.display = '';
            drawGameoverButtons.style.display = 'none';
            drawSeriesScore.style.display = 'none';
            drawShareSection.style.display = 'none';
            GameMult.skipTurn();
            updateGameUI();
            startTurnTimer();
            if (GameMult.isAITurn()) {
                scheduleAI(doAITurn, 800);
            }
        });

        drawPlayAgainBtn.addEventListener('click', () => {
            if (!isMultActive) return;
            drawOverlay.style.display = 'none';
            drawContinueBtn.style.display = '';
            drawGameoverButtons.style.display = 'none';
            drawSeriesScore.style.display = 'none';
            drawShareSection.style.display = 'none';
            stopTurnTimer();
            startRematch();
        });
        drawBackMenuBtn.addEventListener('click', () => {
            if (!isMultActive) return;
            drawOverlay.style.display = 'none';
            drawContinueBtn.style.display = '';
            drawGameoverButtons.style.display = 'none';
            drawSeriesScore.style.display = 'none';
            drawShareSection.style.display = 'none';
            stopTurnTimer();
            GameMult.resetSeriesScore();
            showScreen('menu-mult');
        });

        // Share buttons (win overlay)
        $('#share-x-btn').addEventListener('click', () => { if (isMultActive) shareToX(); });
        $('#share-threads-btn').addEventListener('click', () => { if (isMultActive) shareToThreads(); });
        $('#share-ig-btn').addEventListener('click', () => { if (isMultActive) shareToIG(); });
        // Share buttons (draw overlay)
        $('#draw-share-x-btn').addEventListener('click', () => { if (isMultActive) shareToX(); });
        $('#draw-share-threads-btn').addEventListener('click', () => { if (isMultActive) shareToThreads(); });
        $('#draw-share-ig-btn').addEventListener('click', () => { if (isMultActive) shareToIG(); });

        // Restore saved player names
        try {
            const saved1 = localStorage.getItem('dolanan_p1_name_mult');
            const saved2 = localStorage.getItem('dolanan_p2_name_mult');
            if (saved1) player1Input.value = saved1;
            if (saved2) player2Input.value = saved2;
        } catch (e) { /* ignore */ }

        // Warn before leaving mid-game
        window.addEventListener('beforeunload', (e) => {
            if (isMultActive && GameMult.getPhase() !== 'menu' && GameMult.getWinner() === null) {
                e.preventDefault();
            }
        });

        // Event delegation — game board
        gameBoard.addEventListener('click', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) return;
            handleBoardClick(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        });

        // Event delegation — multiplication board
        gameMultBoard.addEventListener('click', (e) => {
            const cell = e.target.closest('.mult-cell');
            if (!cell) return;
            if (!cell.classList.contains('clickable')) return;
            handleMultBoardClick(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        });

        // Event delegation — placement multiplication board
        placementMultBoard.addEventListener('click', (e) => {
            const cell = e.target.closest('.mult-cell');
            if (!cell) return;
            if (!cell.classList.contains('clickable')) return;
            // Block human clicks when AI won the coin toss and is placing
            if (GameMult.isAIMode() && GameMult.getCoinWinner() === 1) return;
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
            case 'menu-mult':
                menuScreen.classList.add('active');
                document.title = 'Rumah Perkalian - Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'none';
                break;
            case 'coin-mult':
                coinScreen.classList.add('active');
                document.title = 'Rumah Perkalian - Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'flex';
                break;
            case 'placement-mult':
                placementScreen.classList.add('active');
                document.title = 'Rumah Perkalian - Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'flex';
                break;
            case 'game-mult':
                gameScreen.classList.add('active');
                document.title = 'Rumah Perkalian - Dolanan Matematika';
                if (floatingHelp) floatingHelp.style.display = 'flex';
                break;
        }
    }

    // ---- Summary helper ----
    function populateSummaryMeta(resultType, reasonText) {
        const summaryMeta = resultType === 'win' ? $('#win-summary-meta') : $('#draw-summary-meta');
        if (!summaryMeta) return;
        
        const state = GameMult.getState();
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
            isMultGame: true
        };
        
        const p1Name = player1Input.value.trim() || 'Pemain 1';
        const p2Name = selectedMode === 'ai' ? 'AI' : (player2Input.value.trim() || 'Pemain 2');

        // Save names for next session
        try {
            localStorage.setItem('dolanan_p1_name_mult', player1Input.value.trim());
            localStorage.setItem('dolanan_p2_name_mult', player2Input.value.trim());
        } catch (e) { /* ignore */ }

        GameMult.init(selectedMode, p1Name, p2Name, selectedTimeLimit, selectedDifficulty);

        // Reset coin UI
        if (coinResultTimerId !== null) {
            clearTimeout(coinResultTimerId);
            coinResultTimerId = null;
        }
        coinEl.className = 'coin';
        coinChoices.style.display = 'flex';
        coinResult.style.display = 'none';
        coinInstruction.textContent = `${p1Name}, pilih sisi koin:`;

        showScreen('coin-mult');
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
        coinChoices.style.display = 'none';

        const { result, winner } = GameMult.coinToss(choice);

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
            const players = GameMult.getPlayers();
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
        GameMult.setPlacementPhase();
        const players = GameMult.getPlayers();
        const winner = GameMult.getCoinWinner();

        placementInstruction.textContent =
            `${players[winner].name}, letakkan pion pertama di salah satu baris. Klik angka yang diinginkan.`;

        createPlacementBoard();
        updatePlacementCells();
        placementConfirmBtn.style.display = 'none';
        showScreen('placement-mult');

        // If AI won, and AI mode, AI places both pions
        if (GameMult.isAIMode() && winner === 1) {
            scheduleAI(doAIPlacement, 800);
        }
    }

    function createPlacementBoard() {
        placementMultBoard.innerHTML = '';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < MULT_COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'mult-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.textContent = c + 1;
                placementMultBoard.appendChild(cell);
            }
        }
    }

    function updatePlacementCells() {
        const players = GameMult.getPlayers();
        const state = GameMult.getState();
        const cells = placementMultBoard.children;

        // No disabled columns for multiplication placement
        let disabledCols = [];
        if (state.placementStep === 1) {
            const placedCol = players[0].pionPos !== null ? players[0].pionPos : players[1].pionPos;
            disabledCols = GameMult.getDisabledColumnsForPlacement(placedCol);
        }

        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < MULT_COLS; c++) {
                const idx = r * MULT_COLS + c;
                const cell = cells[idx];
                cell.classList.remove('pion-here-1', 'pion-here-2', 'clickable', 'disabled');

                if (players[r].pionPos === c) {
                    cell.classList.add(r === 0 ? 'pion-here-1' : 'pion-here-2');
                }

                if (state.phase === 'placement') {
                    const isAIPlacing = GameMult.isAIMode() && GameMult.getCoinWinner() === 1;
                    if (!isAIPlacing) {
                        const unplaced = GameMult.getUnplacedRow();
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
        // Guard: check disabled columns
        const placementState = GameMult.getState();
        if (placementState.placementStep === 1) {
            const players = GameMult.getPlayers();
            const placedCol = players[0].pionPos !== null ? players[0].pionPos : players[1].pionPos;
            const disabledCols = GameMult.getDisabledColumnsForPlacement(placedCol);
            if (disabledCols.includes(col)) return;
        }

        const result = GameMult.placeInitialPion(row, col);
        if (!result) return;

        const players = GameMult.getPlayers();
        const winner = GameMult.getCoinWinner();

        if (!result.done) {
            const unplaced = GameMult.getUnplacedRow();
            placementInstruction.textContent =
                `${players[winner].name}, sekarang letakkan pion kedua di baris ${unplaced === 0 ? '1 (Biru)' : '2 (Merah)'}.`;
            updatePlacementCells();
        } else {
            updatePlacementCells();
            placementInstruction.textContent = 'Kedua pion telah ditempatkan! Siap bermain.';
            placementConfirmBtn.style.display = 'block';
        }
    }

    function confirmPlacement() {
        setupGameUI();
        showScreen('game-mult');

        // After placement, coin winner immediately places on board
        const product = GameMult.getProduct();
        const availableCells = GameMult.getAvailableCellsForProduct(product);
        const players = GameMult.getPlayers();
        const current = GameMult.getCurrentPlayer();

        productDisplay.textContent = product;
        phaseInstruction.textContent = `${players[current].name}, pilih cell bernilai ${product} di Board Permainan`;

        // Start turn timer for the first board placement
        startTurnTimer();

        if (availableCells.length > 0) {
            highlightAvailableCells(availableCells);
        } else {
            const autoResult = GameMult.checkAutoGameOver(current);
            if (autoResult.autoLose) {
                showAutoLoseOverlay(current, product);
            } else {
                showDrawOverlay();
            }
        }

        // If AI won coin toss, AI places on board
        if (GameMult.isAITurn()) {
            scheduleAI(() => doAIFirstPlacement(product, availableCells), 800);
        }
    }

    function doAIPlacement() {
        // AI places first pion
        let col1;
        try {
            col1 = (AIMult && typeof AIMult.chooseInitialPlacement === 'function')
                ? AIMult.chooseInitialPlacement()
                : fallbackChooseInitialPlacement();
        } catch (e) {
            col1 = fallbackChooseInitialPlacement();
        }
        const unplaced1 = GameMult.getUnplacedRow();
        let firstRow = 1; // AI prefers its own row first
        if (unplaced1 !== 'both' && unplaced1 !== 1) firstRow = 0;

        handlePlacementClick(firstRow, col1);

        scheduleAI(() => {
            let col2;
            try {
                col2 = (AIMult && typeof AIMult.chooseInitialPlacement === 'function')
                    ? AIMult.chooseInitialPlacement(col1)
                    : fallbackChooseInitialPlacement(col1);
            } catch (e) {
                col2 = fallbackChooseInitialPlacement(col1);
            }
            const unplaced2 = GameMult.getUnplacedRow();
            if (unplaced2 !== null && unplaced2 !== 'both') {
                handlePlacementClick(unplaced2, col2);
            }

            scheduleAI(() => {
                confirmPlacement();
            }, 600);
        }, 800);
    }

    function doAIFirstPlacement(product, availableCells) {
        if (availableCells.length === 0) {
            GameMult.skipTurn();
            updateGameUI();
            startTurnTimer();
            return;
        }

        let bestCell;
        try {
            if (AIMult && typeof AIMult.chooseFirstBoardPlacement === 'function') {
                bestCell = AIMult.chooseFirstBoardPlacement(availableCells);
            }
        } catch (e) {
            bestCell = null;
        }
        if (!isCellInList(bestCell, availableCells)) {
            bestCell = fallbackChooseFirstBoardPlacement(availableCells);
        }

        let placeResult = GameMult.placeOnBoard(bestCell.row, bestCell.col);
        if (!placeResult) {
            const fallbackCell = fallbackChooseFirstBoardPlacement(availableCells);
            placeResult = GameMult.placeOnBoard(fallbackCell.row, fallbackCell.col);
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
        const players = GameMult.getPlayers();
        p1NameDisplay.textContent = players[0].name;
        p2NameDisplay.textContent = players[1].name;

        createGameBoard();
        createGameMultBoard();
        updateGameUI();
    }

    function createGameBoard() {
        gameBoard.innerHTML = '';
        for (let r = 0; r < MULT_BOARD_SIZE; r++) {
            for (let c = 0; c < MULT_BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                gameBoard.appendChild(cell);
            }
        }
    }

    function updateBoardCells() {
        const board = GameMult.getBoard();
        const cells = gameBoard.children;
        for (let r = 0; r < MULT_BOARD_SIZE; r++) {
            for (let c = 0; c < MULT_BOARD_SIZE; c++) {
                const idx = r * MULT_BOARD_SIZE + c;
                const cell = cells[idx];
                const data = board[r][c];
                cell.textContent = data.value;
                cell.classList.remove('taken-1', 'taken-2', 'highlight', 'win-cell');
                if (data.owner === 0) cell.classList.add('taken-1');
                else if (data.owner === 1) cell.classList.add('taken-2');
            }
        }
    }

    function createGameMultBoard() {
        gameMultBoard.innerHTML = '';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < MULT_COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'mult-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.textContent = c + 1;
                gameMultBoard.appendChild(cell);
            }
        }
    }

    function updateMultBoardCells() {
        const players = GameMult.getPlayers();
        const state = GameMult.getState();
        const cells = gameMultBoard.children;
        const currentPlayer = GameMult.getCurrentPlayer();
        const isFirst = GameMult.isFirstTurn();

        // Get disabled columns based on phase
        let disabledCols = null;
        if (state.phase === 'move-pion') {
            disabledCols = GameMult.getDisabledColumns(currentPlayer);
        }

        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < MULT_COLS; c++) {
                const idx = r * MULT_COLS + c;
                const cell = cells[idx];
                cell.classList.remove('pion-here-1', 'pion-here-2', 'clickable', 'disabled');

                if (players[r].pionPos === c) {
                    cell.classList.add(r === 0 ? 'pion-here-1' : 'pion-here-2');
                }

                if (state.phase === 'move-pion') {
                    let isClickable = false;
                    if (isFirst && GameMult.getCoinWinner() === currentPlayer) {
                        isClickable = true;
                    } else if (r === currentPlayer) {
                        isClickable = true;
                    }

                    if (isClickable) {
                        let isDisabled = false;
                        if (disabledCols) {
                            if (isFirst) {
                                isDisabled = disabledCols[r] && disabledCols[r].includes(c);
                            } else {
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
        const state = GameMult.getState();
        const players = GameMult.getPlayers();
        const currentPlayer = GameMult.getCurrentPlayer();

        // Turn indicator
        turnIndicator.textContent = `Giliran: ${players[currentPlayer].name}`;
        turnIndicator.style.color = currentPlayer === 0 ? 'var(--blue-light)' : 'var(--red-light)';

        // Active player highlight
        p1Info.classList.toggle('active-turn', currentPlayer === 0);
        p2Info.classList.toggle('active-turn', currentPlayer === 1);

        // Scores
        p1Score.textContent = `${players[0].pionsOnBoard} pion`;
        p2Score.textContent = `${players[1].pionsOnBoard} pion`;

        // Product
        const product = GameMult.getProduct();
        productDisplay.textContent = product !== null ? product : '—';

        // Phase instruction
        if (state.phase === 'move-pion') {
            if (GameMult.isFirstTurn()) {
                phaseInstruction.textContent = `${players[currentPlayer].name}, gerakkan salah satu pion di Board Perkalian (giliran pertama: bisa gerakkan pion manapun)`;
            } else {
                phaseInstruction.textContent = `${players[currentPlayer].name}, gerakkan pion Anda di Board Perkalian`;
            }
        } else if (state.phase === 'place-board') {
            phaseInstruction.textContent = `Pilih cell bernilai ${product} di Board Permainan`;
        }

        // Update board cells (no DOM recreation)
        updateMultBoardCells();
        updateBoardCells();
    }

    // ============================================
    // GAME INTERACTIONS
    // ============================================
    function handleMultBoardClick(row, col) {
        if (GameMult.getPhase() !== 'move-pion') return;
        if (GameMult.isAITurn()) return;

        // Guard: prevent selection of disabled columns
        const currentPlayer = GameMult.getCurrentPlayer();
        const isFirst = GameMult.isFirstTurn();
        const disabledCols = GameMult.getDisabledColumns(currentPlayer);
        if (isFirst) {
            if (disabledCols[row] && disabledCols[row].includes(col)) return;
        } else {
            if (disabledCols.includes(col)) return;
        }

        const result = GameMult.movePion(row, col);
        if (!result) return;

        SFX.click();

        if (result.availableCells.length === 0) {
            updateGameUI();
            highlightAvailableCells([]);
            const autoResult = GameMult.checkAutoGameOver(currentPlayer);
            if (autoResult.autoLose) {
                showAutoLoseOverlay(currentPlayer, result.product);
            } else {
                showDrawOverlay();
            }
            return;
        }

        updateGameUI();
        highlightAvailableCells(result.availableCells);
    }

    function handleBoardClick(row, col) {
        if (GameMult.getPhase() !== 'place-board') return;
        if (GameMult.isAITurn()) return;

        const board = GameMult.getBoard();
        const product = GameMult.getProduct();
        if (board[row][col].value !== product || board[row][col].owner !== null) return;

        const result = GameMult.placeOnBoard(row, col);
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
        if (GameMult.isAITurn()) {
            scheduleAI(doAITurn, 800);
        }
    }

    function highlightAvailableCells(cells) {
        clearHighlights();

        cells.forEach(({ row, col }) => {
            const idx = row * MULT_BOARD_SIZE + col;
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
            const idx = row * MULT_BOARD_SIZE + col;
            const cellEl = gameBoard.children[idx];
            if (cellEl) cellEl.classList.add('win-cell');
        });
    }

    function updateScores() {
        const players = GameMult.getPlayers();
        p1Score.textContent = `${players[0].pionsOnBoard} pion`;
        p2Score.textContent = `${players[1].pionsOnBoard} pion`;
    }

    function showWinOverlay(winnerIdx) {
        stopTurnTimer();
        SFX.win();
        const players = GameMult.getPlayers();
        winTitle.textContent = '🎉 Selamat!';
        winMessage.textContent = `${players[winnerIdx].name} menang dengan 4 pion berjajar!`;
        renderWinPatternGrid(GameMult.getBoard(), GameMult.getWinCells(), MULT_BOARD_SIZE);
        updateSeriesScoreDisplay(winSeriesScore, players);
        populateSummaryMeta('win', 'win');
        currentShareText = buildShareText(players);
        winOverlay.style.display = 'flex';
    }

    // Show timeout lose overlay (player ran out of time)
    function showTimeoutLoseOverlay(loserIdx) {
        stopTurnTimer();
        SFX.error();
        const players = GameMult.getPlayers();
        const winner = 1 - loserIdx;
        GameMult.setWinner(winner);
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

    function showAutoLoseOverlay(loserIdx, product) {
        stopTurnTimer();
        SFX.error();
        const players = GameMult.getPlayers();
        const winner = 1 - loserIdx;
        GameMult.setWinner(winner);
        drawTitle.textContent = '🚫 Game Over!';
        drawMessage.textContent = product !== null
            ? `${players[loserIdx].name} memilih angka yang menghasilkan hasil kali ${product}, ` +
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

    function showDrawOverlay() {
        stopTurnTimer();
        SFX.draw();
        GameMult.setDraw();
        const players = GameMult.getPlayers();
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
        const series = GameMult.getSeriesScore();
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
        const series = GameMult.getSeriesScore();
        const winner = GameMult.getWinner();
        let result = '';
        if (winner === -1) {
            result = '🤝 Seri!';
        } else if (winner !== null) {
            result = `🏆 ${players[winner].name} menang!`;
        }
        let patternText = '';
        if (winner !== null && winner !== -1) {
            patternText = buildWinPatternEmoji(GameMult.getBoard(), GameMult.getWinCells(), MULT_BOARD_SIZE);
        }
        return `🎮 Dolanan Matematika — Rumah Perkalian\n` +
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
        if (!GameMult.isAITurn()) return;
        if (GameMult.getWinner() !== null) return;

        let move;
        try {
            move = (AIMult && typeof AIMult.chooseMove === 'function') ? AIMult.chooseMove() : fallbackChooseMove();
        } catch (e) {
            move = fallbackChooseMove();
        }
        if (!move || typeof move.pionCol !== 'number') {
            move = fallbackChooseMove();
        }

        // First: move AI pion on multiplication board
        const moveResult = GameMult.movePion(1, move.pionCol);
        updateGameUI();

        if (!moveResult) {
            // movePion failed (e.g. same position) — still need to end the game
            const autoResult = GameMult.checkAutoGameOver(1);
            if (autoResult.autoLose) {
                showAutoLoseOverlay(1, null);
            } else {
                showDrawOverlay();
            }
            return;
        }

        if (move.noMoves || moveResult.availableCells.length === 0) {
            highlightAvailableCells([]);
            const autoResult = GameMult.checkAutoGameOver(1);
            if (autoResult.autoLose) {
                showAutoLoseOverlay(1, moveResult.product);
            } else {
                showDrawOverlay();
            }
            return;
        }

        highlightAvailableCells(moveResult.availableCells);

        // Then: place on board after a short delay
        scheduleAI(() => {
            let placeResult = GameMult.placeOnBoard(move.boardRow, move.boardCol);
            if (!placeResult && moveResult.availableCells && moveResult.availableCells.length > 0) {
                const fallbackCell = fallbackChooseFirstBoardPlacement(moveResult.availableCells);
                placeResult = GameMult.placeOnBoard(fallbackCell.row, fallbackCell.col);
            }
            clearHighlights();

            if (!placeResult) {
                GameMult.skipTurn();
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
            const idx = move.boardRow * MULT_BOARD_SIZE + move.boardCol;
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
        const preferred = [4, 3, 5, 2, 6, 1, 7, 0, 8];
        const disabledCols = (firstPionCol !== undefined && firstPionCol !== null)
            ? GameMult.getDisabledColumnsForPlacement(firstPionCol)
            : [];
        const allowed = preferred.filter(c => !disabledCols.includes(c));
        return allowed.length > 0 ? allowed[0] : 0;
    }

    function fallbackChooseMove() {
        const state = GameMult.getState();
        const aiIdx = 1;
        const humanIdx = 0;
        const aiCurrentPos = state.players[aiIdx].pionPos;
        const humanPos = state.players[humanIdx].pionPos;
        const candidates = [];

        for (let pos = 0; pos < MULT_COLS; pos++) {
            if (pos === aiCurrentPos) continue;
            const product = (humanPos + 1) * (pos + 1);
            const cells = GameMult.getAvailableCellsForProduct(product);
            for (const cell of cells) {
                const centerDist = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
                const score = (10 - centerDist) + Math.random() * 5;
                candidates.push({ pionCol: pos, boardRow: cell.row, boardCol: cell.col, score });
            }
        }

        if (candidates.length === 0) {
            return {
                pionCol: (aiCurrentPos + 1) % MULT_COLS,
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

    return { init, isMultActive: () => isMultActive, setMultActive: (val) => { isMultActive = val; } };
})();
