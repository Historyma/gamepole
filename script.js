// ==========================================
// SUDOKU GAME — профілі, меню, налаштування
// ==========================================

const PLAYER_KEY   = "sudoku-current-player";
const PLAYERS_KEY  = "sudoku-players";
const SETTINGS_KEY = "sudoku-settings";

const DIFFICULTIES = {
    4: { easy: 6, medium: 8, hard: 10 },
    6: { easy: 12, medium: 18, hard: 24 },
    9: { easy: 36, medium: 46, hard: 54 }
};

const DIFFICULTY_CONFIG = {
    easy:   { size: 4, difficulty: "easy",   points: 1 },
    medium: { size: 6, difficulty: "medium", points: 2 },
    hard:   { size: 9, difficulty: "hard",   points: 3 }
};

const TRANSLATIONS = {
    uk: {
        "welcome": "Вітаємо в Sudoku",
        "enter-name": "Введіть ваше ім'я, щоб почати",
        "your-name": "Ваше ім'я",
        "continue": "Продовжити",
        "play": "Грати",
        "settings": "Налаштування",
        "score": "Бали",
        "player": "Гравець",
        "achievements": "Досягнення",
        "difficulty": "Складність",
        "best-time": "Кращий час",
        "easy": "Легко",
        "medium": "Середньо",
        "hard": "Складно",
        "choose-difficulty": "Оберіть складність",
        "start-game": "Почати гру",
        "time": "Час",
        "record": "Рекорд",
        "new-game": "Нова гра",
        "check": "Перевірити",
        "language": "Мова",
        "theme": "Тема",
        "light": "Світла",
        "dark": "Темна",
        "player-name": "Ім'я гравця",
        "congrats": "Вітаємо!",
        "back-to-menu": "Повернутися в меню",
        "new-record": "Новий рекорд!",
        "time-passed": "Ви пройшли Sudoku за",
        "found-errors": "Знайдено помилок",
        "try-again": "Спробуйте ще!",
        "keep-going": "Поки все правильно! Продовжуйте.",
        "wrong-numbers": "Є неправильні числа. Перевірте поле!",
        "level-done": "Рівень пройдено!",
        "confirm-quit": "Ви впевнені? Поточний прогрес буде втрачено.",
        "guest": "Гравець",
        "edit-player": "Змінити ім'я"
    },
    en: {
        "welcome": "Welcome to Sudoku",
        "enter-name": "Enter your name to start",
        "your-name": "Your name",
        "continue": "Continue",
        "play": "Play",
        "settings": "Settings",
        "score": "Score",
        "player": "Player",
        "achievements": "Achievements",
        "difficulty": "Difficulty",
        "best-time": "Best time",
        "easy": "Easy",
        "medium": "Medium",
        "hard": "Hard",
        "choose-difficulty": "Choose difficulty",
        "start-game": "Start game",
        "time": "Time",
        "record": "Record",
        "new-game": "New game",
        "check": "Check",
        "language": "Language",
        "theme": "Theme",
        "light": "Light",
        "dark": "Dark",
        "player-name": "Player name",
        "congrats": "Congratulations!",
        "back-to-menu": "Back to menu",
        "new-record": "New record!",
        "time-passed": "You completed Sudoku in",
        "found-errors": "Errors found",
        "try-again": "Try again!",
        "keep-going": "All correct so far! Keep going.",
        "wrong-numbers": "There are incorrect numbers. Check the board!",
        "level-done": "Level completed!",
        "confirm-quit": "Are you sure? Current progress will be lost.",
        "guest": "Player",
        "edit-player": "Change name"
    }
};

let appState = {
    currentPlayer: null,
    players: {},
    settings: { language: "uk", theme: "light" }
};

let selectedDifficulty = null;

let game = {
    size: 4,
    difficulty: "easy",
    selectedCell: null,
    board: [],
    solution: [],
    initialBoard: [],
    errors: [],
    seconds: 0,
    timer: null,
    completed: false
};

const $ = id => document.getElementById(id);

const boardElement      = $("sudoku-board");
const numberButtons     = $("number-buttons");
const timerElement      = $("timer");
const messageElement    = $("message");

const menuScore         = $("menu-score");
const menuPlayerName    = $("menu-player-name");
const gameScore         = $("game-score");
const gameDifficulty    = $("game-difficulty");
const gameRecord        = $("game-record");
const achievementsBody  = $("achievements-body");

const winModal          = $("win-modal");
const winText           = $("win-text");
const earnedPoints      = $("earned-points");
const recordBadge       = $("record-badge");

const welcomeInput      = $("welcome-name");
const playerNameInput   = $("player-name-input");

// ==========================================
// I18N
// ==========================================
function t(key) {
    const lang = appState.settings.language;
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
}

function applyLanguage() {
    const lang = appState.settings.language;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        const text = t(key);
        if (text && text !== key) el.textContent = text;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const text = t(key);
        if (text && text !== key) el.placeholder = text;
    });

    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.dataset.i18nTitle;
        const text = t(key);
        if (text && text !== key) el.title = text;
    });

    document.documentElement.lang = lang;

    if (menuPlayerName) renderMenu();
    if (gameDifficulty) updateGameInfo();
}

// ==========================================
// ТЕМА
// ==========================================
function applyTheme() {
    document.documentElement.setAttribute("data-theme", appState.settings.theme);
}

// ==========================================
// СХОВИЩЕ / ПРОФІЛІ
// ==========================================
function savePlayers() {
    try { localStorage.setItem(PLAYERS_KEY, JSON.stringify(appState.players)); } catch {}
}

function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(appState.settings)); } catch {}
}

function loadAppState() {
    try {
        const players = JSON.parse(localStorage.getItem(PLAYERS_KEY));
        if (players && typeof players === "object") appState.players = players;
    } catch {}

    const current = localStorage.getItem(PLAYER_KEY);
    if (current) appState.currentPlayer = current;

    try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (settings && typeof settings === "object") {
            appState.settings = {
                language: settings.language === "en" ? "en" : "uk",
                theme: settings.theme === "dark" ? "dark" : "light"
            };
        }
    } catch {}

    if (appState.currentPlayer && !appState.players[appState.currentPlayer]) {
        appState.currentPlayer = null;
    }
}

function getCurrentPlayer() {
    return appState.players[appState.currentPlayer] || null;
}

function createPlayer(name) {
    return {
        name,
        score: 0,
        bestTimes: { easy: null, medium: null, hard: null }
    };
}

function setCurrentPlayer(rawName) {
    let name = (rawName || "").trim();
    if (!name) {
        name = t("guest") + " #" + Math.floor(Math.random() * 9000 + 1000);
    }

    if (!appState.players[name]) {
        appState.players[name] = createPlayer(name);
    }

    appState.currentPlayer = name;
    localStorage.setItem(PLAYER_KEY, name);
    savePlayers();
}

function changePlayer(rawName) {
    const name = (rawName || "").trim();
    if (!name || name === appState.currentPlayer) return;
    setCurrentPlayer(name);
    renderMenu();
}

// ==========================================
// ЕКРАНИ
// ==========================================
function showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const screen = $("screen-" + name);
    if (screen) screen.classList.add("active");
    window.scrollTo(0, 0);
}

// ==========================================
// ГЕНЕРАТОР SUDOKU
// ==========================================
function getBoxSize(size) {
    if (size === 4) return [2, 2];
    if (size === 6) return [2, 3];
    return [3, 3];
}

function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function emptyBoard(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
}

function isValid(board, row, col, value) {
    const size = board.length;
    for (let i = 0; i < size; i++) {
        if (board[row][i] === value) return false;
        if (board[i][col] === value) return false;
    }
    const [boxRows, boxCols] = getBoxSize(size);
    const startRow = Math.floor(row / boxRows) * boxRows;
    const startCol = Math.floor(col / boxCols) * boxCols;
    for (let r = startRow; r < startRow + boxRows; r++) {
        for (let c = startCol; c < startCol + boxCols; c++) {
            if (board[r][c] === value) return false;
        }
    }
    return true;
}

function findEmpty(board) {
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board.length; c++) {
            if (board[r][c] === 0) return [r, c];
        }
    }
    return null;
}

function solveSudoku(board) {
    const empty = findEmpty(board);
    if (!empty) return true;
    const [row, col] = empty;
    const numbers = shuffle(Array.from({ length: board.length }, (_, i) => i + 1));
    for (const number of numbers) {
        if (isValid(board, row, col, number)) {
            board[row][col] = number;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
        }
    }
    return false;
}

function countSolutions(board, limit = 2) {
    const empty = findEmpty(board);
    if (!empty) return 1;
    const [row, col] = empty;
    let count = 0;
    for (let n = 1; n <= board.length; n++) {
        if (isValid(board, row, col, n)) {
            board[row][col] = n;
            count += countSolutions(board, limit);
            board[row][col] = 0;
            if (count >= limit) return count;
        }
    }
    return count;
}

function generatePuzzle(size, difficulty) {
    const solution = emptyBoard(size);
    if (!solveSudoku(solution)) throw new Error("Не вдалося створити Sudoku");
    const puzzle = solution.map(row => [...row]);
    const removeCount = DIFFICULTIES[size][difficulty];
    const positions = shuffle(Array.from({ length: size * size }, (_, i) => i));
    let removed = 0;
    for (const position of positions) {
        if (removed >= removeCount) break;
        const row = Math.floor(position / size);
        const col = position % size;
        const backup = puzzle[row][col];
        puzzle[row][col] = 0;
        const test = puzzle.map(r => [...r]);
        if (countSolutions(test, 2) === 1) {
            removed++;
        } else {
            puzzle[row][col] = backup;
        }
    }
    return { puzzle, solution };
}

// ==========================================
// СТАРТ ГРИ
// ==========================================
function startGame(difficulty) {
    const config = DIFFICULTY_CONFIG[difficulty];
    if (!config) return;

    clearInterval(game.timer);
    winModal.classList.add("hidden");

    game.size = config.size;
    game.difficulty = difficulty;
    game.selectedCell = null;
    game.errors = [];
    game.seconds = 0;
    game.completed = false;

    const generated = generatePuzzle(game.size, config.difficulty);
    game.board = generated.puzzle.map(r => [...r]);
    game.initialBoard = generated.puzzle.map(r => [...r]);
    game.solution = generated.solution;

    renderBoard();
    renderNumberButtons();
    updateGameInfo();
    updateScoreDisplays();

    messageElement.textContent = "";
    messageElement.className = "message";

    showScreen("game");
    startTimer();
}

// ==========================================
// ВІДОБРАЖЕННЯ ПОЛЯ
// ==========================================
function renderBoard() {
    const size = game.size;
    boardElement.innerHTML = "";
    boardElement.className = `sudoku-board size-${size}`;
    boardElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            const value = game.board[row][col];
            if (value !== 0) {
                cell.textContent = value;
                if (game.initialBoard[row][col] !== 0) {
                    cell.classList.add("fixed");
                } else {
                    cell.classList.add("user-value");
                }
            }

            cell.addEventListener("click", () => selectCell(row, col));
            boardElement.appendChild(cell);
        }
    }
    updateHighlights();
}

function selectCell(row, col) {
    if (game.completed) return;
    game.selectedCell = { row, col };
    updateHighlights();
}

function updateHighlights() {
    const cells = boardElement.querySelectorAll(".cell");
    cells.forEach(cell => {
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);
        cell.classList.remove("selected", "same-number", "error");

        if (game.selectedCell &&
            game.selectedCell.row === row &&
            game.selectedCell.col === col) {
            cell.classList.add("selected");
        }

        const selectedValue = game.selectedCell
            ? game.board[game.selectedCell.row][game.selectedCell.col]
            : 0;

        if (selectedValue !== 0 && game.board[row][col] === selectedValue) {
            cell.classList.add("same-number");
        }

        if (game.errors.some(e => e.row === row && e.col === col)) {
            cell.classList.add("error");
        }
    });
}

// ==========================================
// КНОПКИ ЦИФР
// ==========================================
function renderNumberButtons() {
    numberButtons.innerHTML = "";

    for (let number = 1; number <= game.size; number++) {
        const button = document.createElement("button");
        button.className = "number-btn";
        button.textContent = number;
        button.type = "button";
        button.addEventListener("click", () => enterNumber(number));
        numberButtons.appendChild(button);
    }

    const erase = document.createElement("button");
    erase.className = "number-btn erase-btn";
    erase.textContent = "⌫";
    erase.type = "button";
    erase.addEventListener("click", eraseNumber);
    numberButtons.appendChild(erase);
}

function enterNumber(number) {
    if (!game.selectedCell || game.completed) return;
    const { row, col } = game.selectedCell;
    if (game.initialBoard[row][col] !== 0) return;

    game.board[row][col] = number;
    game.errors = game.errors.filter(e => !(e.row === row && e.col === col));
    renderBoard();
    if (isBoardComplete()) finishGame();
}

function eraseNumber() {
    if (!game.selectedCell || game.completed) return;
    const { row, col } = game.selectedCell;
    if (game.initialBoard[row][col] !== 0) return;

    game.board[row][col] = 0;
    game.errors = game.errors.filter(e => !(e.row === row && e.col === col));
    renderBoard();
}

// ==========================================
// ПЕРЕВІРКА
// ==========================================
function isBoardComplete() {
    return game.board.every(row => row.every(v => v !== 0));
}

function checkBoard() {
    if (game.completed) return;
    game.errors = [];

    for (let row = 0; row < game.size; row++) {
        for (let col = 0; col < game.size; col++) {
            if (game.board[row][col] !== 0 &&
                game.board[row][col] !== game.solution[row][col]) {
                game.errors.push({ row, col });
            }
        }
    }

    updateHighlights();

    if (game.errors.length > 0) {
        messageElement.textContent =
            `${t("found-errors")}: ${game.errors.length}. ${t("try-again")}`;
        messageElement.className = "message error";
        return;
    }

    if (!isBoardComplete()) {
        messageElement.textContent = t("keep-going");
        messageElement.className = "message success";
        return;
    }

    finishGame();
}

// ==========================================
// ПЕРЕМОГА
// ==========================================
function finishGame() {
    if (game.completed) return;

    for (let row = 0; row < game.size; row++) {
        for (let col = 0; col < game.size; col++) {
            if (game.board[row][col] !== game.solution[row][col]) {
                messageElement.textContent = t("wrong-numbers");
                messageElement.className = "message error";
                game.errors = [{ row, col }];
                updateHighlights();
                return;
            }
        }
    }

    game.completed = true;
    clearInterval(game.timer);

    const player = getCurrentPlayer();
    const config = DIFFICULTY_CONFIG[game.difficulty];
    if (!player || !config) return;

    player.score += config.points;

    const currentBest = player.bestTimes[game.difficulty];
    const isNewRecord = currentBest === null || game.seconds < currentBest;
    if (isNewRecord) player.bestTimes[game.difficulty] = game.seconds;

    savePlayers();
    updateScoreDisplays();
    renderMenu();

    earnedPoints.textContent = config.points;
    winText.textContent = `${t("time-passed")} ${formatTime(game.seconds)}!`;

    if (isNewRecord) recordBadge.classList.remove("hidden");
    else recordBadge.classList.add("hidden");

    winModal.classList.remove("hidden");
    messageElement.textContent = t("level-done");
    messageElement.className = "message success";
}

// ==========================================
// ТАЙМЕР
// ==========================================
function startTimer() {
    clearInterval(game.timer);
    game.timer = setInterval(() => {
        if (!game.completed) {
            game.seconds++;
            timerElement.textContent = formatTime(game.seconds);
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
}

// ==========================================
// СТАТИСТИКА / ВІДОБРАЖЕННЯ
// ==========================================
function updateScoreDisplays() {
    const player = getCurrentPlayer();
    const score = player ? player.score : 0;
    if (gameScore) gameScore.textContent = score;
    if (menuScore) menuScore.textContent = score;
}

function updateGameInfo() {
    const player = getCurrentPlayer();
    const diff = game.difficulty || "easy";
    if (gameDifficulty) gameDifficulty.textContent = t(diff);
    if (timerElement) timerElement.textContent = formatTime(game.seconds);
    if (gameRecord) {
        const best = player ? player.bestTimes[diff] : null;
        gameRecord.textContent = best !== null ? formatTime(best) : "--:--";
    }
}

function renderMenu() {
    const player = getCurrentPlayer();
    if (!player) return;

    menuScore.textContent = player.score;
    menuPlayerName.textContent = player.name;

    achievementsBody.innerHTML = "";
    ["easy", "medium", "hard"].forEach(diff => {
        const best = player.bestTimes[diff];
        const row = document.createElement("tr");
        row.innerHTML =
            `<td>${t(diff)}</td>` +
            `<td>${best !== null ? formatTime(best) : "--:--"}</td>`;
        achievementsBody.appendChild(row);
    });
}

function renderSetup() {
    const player = getCurrentPlayer();

    document.querySelectorAll("[data-best-time]").forEach(el => {
        const diff = el.dataset.bestTime;
        const best = player ? player.bestTimes[diff] : null;
        el.textContent = best !== null ? formatTime(best) : "--:--";
    });

    selectedDifficulty = null;
    document.querySelectorAll(".difficulty-option").forEach(btn => {
        btn.classList.remove("active");
    });
    $("btn-start").disabled = true;
}

function renderSettings() {
    playerNameInput.value = appState.currentPlayer || "";

    document.querySelectorAll("[data-lang]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === appState.settings.language);
    });

    document.querySelectorAll("[data-theme-btn]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.themeBtn === appState.settings.theme);
    });
}

// ==========================================
// ПОДІЇ
// ==========================================
function bindEvents() {
    $("welcome-continue").addEventListener("click", () => {
        setCurrentPlayer(welcomeInput.value);
        renderMenu();
        showScreen("menu");
    });

    welcomeInput.addEventListener("keydown", e => {
        if (e.key === "Enter") $("welcome-continue").click();
    });

    $("btn-play").addEventListener("click", () => {
        renderSetup();
        showScreen("setup");
    });

    $("btn-settings").addEventListener("click", () => {
        renderSettings();
        showScreen("settings");
    });

    $("menu-edit-player").addEventListener("click", () => {
        renderSettings();
        showScreen("settings");
        setTimeout(() => playerNameInput.focus(), 100);
    });

    $("setup-back").addEventListener("click", () => showScreen("menu"));

    document.querySelectorAll(".difficulty-option").forEach(btn => {
        btn.addEventListener("click", () => {
            selectedDifficulty = btn.dataset.difficulty;
            document.querySelectorAll(".difficulty-option").forEach(b => {
                b.classList.toggle("active", b === btn);
            });
            $("btn-start").disabled = false;
        });
    });

    $("btn-start").addEventListener("click", () => {
        if (!selectedDifficulty) return;
        startGame(selectedDifficulty);
    });

    $("game-back").addEventListener("click", () => {
        if (game.completed) {
            showScreen("menu");
            return;
        }
        if (confirm(t("confirm-quit"))) {
            clearInterval(game.timer);
            showScreen("menu");
        }
    });

    $("new-game-btn").addEventListener("click", () => startGame(game.difficulty));
    $("check-btn").addEventListener("click", checkBoard);

    $("modal-close-btn").addEventListener("click", () => {
        winModal.classList.add("hidden");
        showScreen("menu");
        renderMenu();
    });

    $("settings-back").addEventListener("click", () => {
        changePlayer(playerNameInput.value);
        showScreen("menu");
    });

    playerNameInput.addEventListener("keydown", e => {
        if (e.key === "Enter") $("settings-back").click();
    });

    document.querySelectorAll("[data-lang]").forEach(btn => {
        btn.addEventListener("click", () => {
            appState.settings.language = btn.dataset.lang;
            saveSettings();
            applyLanguage();
            renderSettings();
        });
    });

    document.querySelectorAll("[data-theme-btn]").forEach(btn => {
        btn.addEventListener("click", () => {
            appState.settings.theme = btn.dataset.themeBtn;
            saveSettings();
            applyTheme();
            renderSettings();
        });
    });

    document.addEventListener("keydown", e => {
        if (!$("screen-game").classList.contains("active")) return;
        if (game.completed || !game.selectedCell) return;

        const key = e.key;

        if (/^[1-9]$/.test(key)) {
            const n = Number(key);
            if (n <= game.size) enterNumber(n);
        }

        if (key === "Backspace" || key === "Delete") eraseNumber();

        let nextRow = game.selectedCell.row;
        let nextCol = game.selectedCell.col;

        if (key === "ArrowUp")    nextRow--;
        if (key === "ArrowDown")  nextRow++;
        if (key === "ArrowLeft")  nextCol--;
        if (key === "ArrowRight") nextCol++;

        if (nextRow >= 0 && nextRow < game.size &&
            nextCol >= 0 && nextCol < game.size) {
            selectCell(nextRow, nextCol);
        }
    });
}

// ==========================================
// ЗАПУСК
// ==========================================
function init() {
    loadAppState();
    applyTheme();
    applyLanguage();
    bindEvents();

    if (!appState.currentPlayer) {
        showScreen("welcome");
        welcomeInput.focus();
    } else {
        renderMenu();
        showScreen("menu");
    }

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        });
    }
}

init();