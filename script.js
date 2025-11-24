document.addEventListener('DOMContentLoaded', () => {
    const introScreen = document.getElementById('intro-screen');
    const usernameScreen = document.getElementById('username-screen');
    const gameContainer = document.getElementById('game-container');
    const popup = document.getElementById('popup');
    const playButton = document.getElementById('play-button');
    const startButton = document.getElementById('start-button');
    const usernameInput = document.getElementById('username-input');
    const usernameDisplay = document.getElementById('username-display');
    const scoreDisplay = document.getElementById('score');
    const levelDisplay = document.getElementById('level');
    const popupMessage = document.getElementById('popup-message');
    const tryAgainButton = document.getElementById('try-again-button');

    const canvas = document.getElementById('tetris-canvas');
    const context = canvas.getContext('2d');

    const COLS = 20;
    const ROWS = 10;
    const BLOCK_SIZE = 30;

    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;

    context.scale(BLOCK_SIZE, BLOCK_SIZE);

    let score = 0;
    let level = 1;
    let lines = 0;
    let username = '';

    playButton.addEventListener('click', () => {
        introScreen.classList.add('hidden');
        usernameScreen.classList.remove('hidden');
    });

    startButton.addEventListener('click', () => {
        username = usernameInput.value;
        if (username) {
            usernameDisplay.textContent = username;
            usernameScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            startGame();
        }
    });

    tryAgainButton.addEventListener('click', () => {
        popup.classList.add('hidden');
        resetGame();
    });

    // Game state
    let board;
    let player;
    let dropCounter;
    let dropInterval;
    let lastTime;
    let animationFrameId;

    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const rotateButton = document.getElementById('rotate-button');
    const dropButton = document.getElementById('drop-button');

    leftButton.addEventListener('click', () => playerMove(-1));
    rightButton.addEventListener('click', () => playerMove(1));
    rotateButton.addEventListener('click', () => playerRotate());
    dropButton.addEventListener('click', () => playerDrop(true));


    function createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    function draw() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        drawMatrix(board, { x: 0, y: 0 });
        drawMatrix(player.matrix, player.pos);
    }

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = COLORS[value];
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    const COLORS = [
        null,
        '#FF0D72', // I
        '#0DC2FF', // L
        '#0DFF72', // J
        '#F538FF', // S
        '#FF8E0D', // Z
        '#FFE138', // T
        '#3877FF', // O
    ];

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(board, player)) {
            player.pos.x -= dir;
        }
    }
    
    function playerRotate() {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix);
        while (collide(board, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix); //rotate back
                player.pos.x = pos;
                return;
            }
        }
    }
    
    function rotate(matrix) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        matrix.forEach(row => row.reverse());
    }

    function sweep() {
        let rowsCleared = 0;
        outer: for (let y = board.length - 1; y > 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            y++;
            rowsCleared++;
        }
        return rowsCleared;
    }

    function updateScore(rowsCleared) {
        if (rowsCleared > 0) {
            if (rowsCleared === 1) {
                score += 10;
            } else if (rowsCleared === 2) {
                score += 20;
            } else if (rowsCleared === 3) {
                score += 30;
            } else if (rowsCleared >= 4) {
                score += 40;
            }
            lines += rowsCleared;
            if (lines >= 2) {
                level++;
                lines -= 2;
                dropInterval *= 0.9;
            }
            scoreDisplay.textContent = score;
            levelDisplay.textContent = level;
            if (score >= 500) {
                cancelAnimationFrame(animationFrameId);
                popupMessage.textContent = 'congrats you are champian';
                tryAgainButton.classList.remove('hidden');
                popup.classList.remove('hidden');
            }
        }
    }

    function playerDrop(hardDrop = false) {
        if (hardDrop) {
            while (!collide(board, player)) {
                player.pos.y++;
            }
            player.pos.y--;
            merge(board, player);
            playerReset();
            const rowsCleared = sweep();
            updateScore(rowsCleared);
        } else {
            player.pos.y++;
            if (collide(board, player)) {
                player.pos.y--;
                merge(board, player);
                playerReset();
                const rowsCleared = sweep();
                updateScore(rowsCleared);
            }
            dropCounter = 0;
        }
    }
    
    function collide(board, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function playerReset() {
        const tetrominoes = 'ILJSTZO';
        const type = tetrominoes[tetrominoes.length * Math.random() | 0];
        player.matrix = createPiece(type);
        player.pos.y = 0;
        player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
        if (collide(board, player)) {
            cancelAnimationFrame(animationFrameId);
            popupMessage.textContent = `Game Over! Your score: ${score}`;
            tryAgainButton.classList.remove('hidden');
            popup.classList.remove('hidden');
        }
    }
    
    function update(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        draw();
        animationFrameId = requestAnimationFrame(update);
    }

    function startGame() {
        board = createBoard();
        player = {
            pos: { x: 0, y: 0 },
            matrix: null,
        };
        score = 0;
        level = 1;
        lines = 0;
        dropInterval = 1000;
        lastTime = 0;
        dropCounter = 0;

        scoreDisplay.textContent = score;
        levelDisplay.textContent = level;

        playerReset();
        update();
    }
    
    function resetGame() {
        cancelAnimationFrame(animationFrameId);
        startGame();
    }

    function createPiece(type) {
        if (type === 'I') {
            return [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]];
        } else if (type === 'L') {
            return [[0,0,2],[2,2,2],[0,0,0]];
        } else if (type === 'J') {
            return [[3,0,0],[3,3,3],[0,0,0]];
        } else if (type === 'S') {
            return [[0,4,4],[4,4,0],[0,0,0]];
        } else if (type === 'Z') {
            return [[5,5,0],[0,5,5],[0,0,0]];
        } else if (type === 'T') {
            return [[0,6,0],[6,6,6],[0,0,0]];
        } else if (type === 'O') {
            return [[7,7],[7,7]];
        }
    }
});

