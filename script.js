// ==========================================
// SUDOKU GAME
// Pure JavaScript
// ==========================================

// ---------- НАЛАШТУВАННЯ ----------

const STORAGE_KEY = "sudoku-game-data";

const DIFFICULTIES = {
    4: { easy: 6, medium: 8, hard: 10 },
    6: { easy: 12, medium: 18, hard: 24 },
    9: { easy: 36, medium: 46, hard: 54 }
};

const LEVEL_CONFIG = {
    4: { difficulty: "easy", points: 1, label: "Легко" },
    6: { difficulty: "medium", points: 2, label: "Середньо" },
    9: { difficulty: "hard", points: 3, label: "Експерт" }
};

// ---------- СТАН ГРИ ----------

let game = {
    size: 4,
    level: 1,
    score: 0,
    selectedCell: null,
    board: [],
    solution: [],
    initialBoard: [],
    errors: [],
    seconds: 0,
    timer: null,
    started: false,
    completed: false,
    points: 1
};

// ---------- DOM ----------

const boardElement = document.getElementById("sudoku-board");
const numberButtons = document.getElementById("number-buttons");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const difficultyElement = document.getElementById("difficulty");
const timerElement = document.getElementById("timer");
const messageElement = document.getElementById("message");

const modal = document.getElementById("win-modal");
const winText = document.getElementById("win-text");
const earnedPoints = document.getElementById("earned-points");

const nextLevelButton = document.getElementById("next-level-btn");
const newGameButton = document.getElementById("new-game-btn");
const checkButton = document.getElementById("check-btn");

// ==========================================
// ЗБЕРЕЖЕННЯ
// ==========================================

function saveProgress() {
    const data = {
        score: game.score,
        level: game.level,
        size: game.size
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadProgress() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (data) {
            game.score = Math.max(0, Number(data.score) || 0);
            game.level = Math.max(1, Number(data.level) || 1);
        }
    } catch {
        game.score = 0;
        game.level = 1;
    }

    updateStats();
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
    return Array.from(
        { length: size },
        () => Array(size).fill(0)
    );
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
            if (board[r][c] === 0) {
                return [r, c];
            }
        }
    }

    return null;
}

function solveSudoku(board) {
    const empty = findEmpty(board);

    if (!empty) return true;

    const [row, col] = empty;

    const numbers = shuffle(
        Array.from(
            { length: board.length },
            (_, i) => i + 1
        )
    );

    for (const number of numbers) {
        if (isValid(board, row, col, number)) {
            board[row][col] = number;

            if (solveSudoku(board)) {
                return true;
            }

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

    if (!solveSudoku(solution)) {
        throw new Error("Не вдалося створити Sudoku");
    }

    const puzzle = solution.map(row => [...row]);

    const removeCount = DIFFICULTIES[size][difficulty];

    const positions = shuffle(
        Array.from(
            { length: size * size },
            (_, i) => i
        )
    );

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

    return {
        puzzle,
        solution
    };
}

// ==========================================
// СИСТЕМА РІВНІВ
// ==========================================

function getLevelConfig(level) {
    // Кожен третій рівень: 6x6
    // Кожен шостий рівень: 9x9

    if (level % 6 === 0) {
        return {
            size: 9,
            ...LEVEL_CONFIG[9]
        };
    }

    if (level % 3 === 0) {
        return {
            size: 6,
            ...LEVEL_CONFIG[6]
        };
    }

    return {
        size: 4,
        ...LEVEL_CONFIG[4]
    };
}

// ==========================================
// НОВА ГРА
// ==========================================

function startGame(customSize = null) {
    clearInterval(game.timer);

    modal.classList.add("hidden");

    game.completed = false;
    game.seconds = 0;
    game.selectedCell = null;
    game.errors = [];
    game.started = true;

    let config;

    if (customSize) {
        game.size = customSize;

        // Використовуємо ту саму конфігурацію, що й для рівнів
        config = {
            size: customSize,
            ...LEVEL_CONFIG[customSize]
        };
    } else {
        config = getLevelConfig(game.level);
        game.size = config.size;
    }

    const generated = generatePuzzle(
        game.size,
        config.difficulty
    );

    game.board = generated.puzzle.map(row => [...row]);
    game.initialBoard = generated.puzzle.map(row => [...row]);
    game.solution = generated.solution;
    game.points = config.points;

    updateStats(config.label);
    renderBoard();
    renderNumberButtons();
    updateTimer();

    messageElement.textContent = "";
    messageElement.className = "message";

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

            cell.addEventListener("click", () => {
                selectCell(row, col);
            });

            boardElement.appendChild(cell);
        }
    }

    updateHighlights();
}

// ==========================================
// ВИБІР КЛІТИНКИ
// ==========================================

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

        cell.classList.remove(
            "selected",
            "same-number",
            "error"
        );

        if (
            game.selectedCell &&
            game.selectedCell.row === row &&
            game.selectedCell.col === col
        ) {
            cell.classList.add("selected");
        }

        const selectedValue = game.selectedCell
            ? game.board[game.selectedCell.row][game.selectedCell.col]
            : 0;

        if (
            selectedValue !== 0 &&
            game.board[row][col] === selectedValue
        ) {
            cell.classList.add("same-number");
        }

        if (
            game.errors.some(e => e.row === row && e.col === col)
        ) {
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

        button.addEventListener("click", () => {
            enterNumber(number);
        });

        numberButtons.appendChild(button);
    }

    const erase = document.createElement("button");

    erase.className = "number-btn erase-btn";
    erase.textContent = "⌫";
    erase.type = "button";
    erase.setAttribute("aria-label", "Очистити клітинку");

    erase.addEventListener("click", eraseNumber);

    numberButtons.appendChild(erase);
}

function enterNumber(number) {
    if (!game.selectedCell || game.completed) return;

    const { row, col } = game.selectedCell;

    if (game.initialBoard[row][col] !== 0) return;

    game.board[row][col] = number;

    game.errors = game.errors.filter(
        e => !(e.row === row && e.col === col)
    );

    renderBoard();

    if (isBoardComplete()) {
        finishGame();
    }
}

function eraseNumber() {
    if (!game.selectedCell || game.completed) return;

    const { row, col } = game.selectedCell;

    if (game.initialBoard[row][col] !== 0) return;

    game.board[row][col] = 0;

    game.errors = game.errors.filter(
        e => !(e.row === row && e.col === col)
    );

    renderBoard();
}

// ==========================================
// ПЕРЕВІРКА ГРИ
// ==========================================

function isBoardComplete() {
    return game.board.every(row =>
        row.every(value => value !== 0)
    );
}

function checkBoard() {
    if (game.completed) return;

    game.errors = [];

    for (let row = 0; row < game.size; row++) {
        for (let col = 0; col < game.size; col++) {
            if (
                game.board[row][col] !== 0 &&
                game.board[row][col] !== game.solution[row][col]
            ) {
                game.errors.push({ row, col });
            }
        }
    }

    updateHighlights();

    if (game.errors.length > 0) {
        messageElement.textContent =
            `Знайдено помилок: ${game.errors.length}. Спробуйте ще!`;

        messageElement.className = "message error";

        return;
    }

    if (!isBoardComplete()) {
        messageElement.textContent =
            "Поки все правильно! Продовжуйте заповнювати поле.";

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

    // Перевіряємо ВСЕ поле, а не тільки кількість заповнених клітинок.
    for (let row = 0; row < game.size; row++) {
        for (let col = 0; col < game.size; col++) {
            if (game.board[row][col] !== game.solution[row][col]) {
                messageElement.textContent =
                    "Є неправильні числа. Перевірте поле!";

                messageElement.className = "message error";

                game.errors = [{ row, col }];
                updateHighlights();

                return;
            }
        }
    }

    game.completed = true;

    clearInterval(game.timer);

    const points = game.points;

    game.score += points;
    game.level++;

    saveProgress();
    updateStats();

    earnedPoints.textContent = points;

    winText.textContent =
        `Ви пройшли Sudoku за ${formatTime(game.seconds)}!`;

    modal.classList.remove("hidden");

    messageElement.textContent = "Рівень пройдено!";
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
            updateTimer();
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}

function updateTimer() {
    timerElement.textContent = formatTime(game.seconds);
}

// ==========================================
// СТАТИСТИКА
// ==========================================

function updateStats(label = null) {
    scoreElement.textContent = game.score;
    levelElement.textContent = game.level;

    const config = getLevelConfig(game.level);

    difficultyElement.textContent =
        label || config.label;

    document.querySelectorAll(".size-btn").forEach(button => {
        button.classList.toggle(
            "active",
            Number(button.dataset.size) === game.size
        );
    });
}

// ==========================================
// КЕРУВАННЯ
// ==========================================

newGameButton.addEventListener("click", () => {
    startGame(game.size);
});

checkButton.addEventListener("click", checkBoard);

nextLevelButton.addEventListener("click", () => {
    startGame();
});

document.querySelectorAll(".size-btn").forEach(button => {
    button.addEventListener("click", () => {
        const size = Number(button.dataset.size);

        startGame(size);
    });
});

// ==========================================
// КЛАВІАТУРА
// ==========================================

document.addEventListener("keydown", event => {
    if (game.completed) return;

    if (!game.selectedCell) return;

    const key = event.key;

    if (/^[1-9]$/.test(key)) {
        const number = Number(key);

        if (number <= game.size) {
            enterNumber(number);
        }
    }

    if (key === "Backspace" || key === "Delete") {
        eraseNumber();
    }

    const { row, col } = game.selectedCell;

    let nextRow = row;
    let nextCol = col;

    if (key === "ArrowUp") nextRow--;
    if (key === "ArrowDown") nextRow++;
    if (key === "ArrowLeft") nextCol--;
    if (key === "ArrowRight") nextCol++;

    if (
        nextRow >= 0 &&
        nextRow < game.size &&
        nextCol >= 0 &&
        nextCol < game.size
    ) {
        selectCell(nextRow, nextCol);
    }
});

// ==========================================
// ЗАПУСК
// ==========================================

loadProgress();
startGame();