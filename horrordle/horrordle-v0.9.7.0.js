// =====================
// Constants and Config
// =====================
const CONFIG = {
    MAX_ATTEMPTS: 6,
    WORD_LENGTH: 5,
    HINT_THRESHOLD: 5,
    ANIMATION_DELAY: 500,
    URLS: {
        DICTIONARY: 'https://jonwcole.github.io/horrordle/dictionary-v1.2.json',
        WORDS: 'https://jonwcole.github.io/horrordle/words-v1.6.json'
    }
};

// =================
// Utility Classes
// =================
class LocalStorageManager {
    static get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing ${key} to localStorage:`, error);
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
        }
    }
}

// =================
// Game State Class
// =================
class GameState {
    constructor() {
        this.wordOfTheDay = '';
        this.wordOfTheDayNormalized = '';
        this.hintOfTheDay = '';
        this.contextOfTheDay = '';
        this.dictionary = [];
        this.currentAttempt = 0;
        this.currentGuess = [];
        this.gameDate = '';
        this.isGameOver = false;
        this.incorrectGuesses = 0;
        this.hintDisplayed = false;
        this.isRevealingGuess = false;
        this.gameGuessColors = [];
        this.gameGuessLetters = [];
    }

    async initialize() {
        await this.loadGameData();
        this.restoreGameState();
        return this;
    }

    async loadGameData() {
        try {
            const [dictionaryResponse, wordsResponse] = await Promise.all([
                fetch(CONFIG.URLS.DICTIONARY),
                fetch(CONFIG.URLS.WORDS)
            ]);

            this.dictionary = (await dictionaryResponse.json()).map(word => word.toUpperCase());
            const wordsData = await wordsResponse.json();
            
            const today = this.getTodayDate();
            const wordData = wordsData[today];

            if (!wordData) {
                throw new Error('Word for today not found');
            }

            this.wordOfTheDay = wordData.word.toUpperCase();
            this.wordOfTheDayNormalized = this.normalizeWord(this.wordOfTheDay);
            this.hintOfTheDay = wordData.hint;
            this.contextOfTheDay = wordData.context || '';
            this.gameDate = today;

            this.checkNewDay();
        } catch (error) {
            console.error('Error loading game data:', error);
            this.handleGameLoadError(error);
        }
    }

    getTodayDate() {
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const adjustedNow = new Date(now.getTime() - timezoneOffset);
        return adjustedNow.toISOString().slice(0, 10);
    }

    checkNewDay() {
        const storedDate = LocalStorageManager.get('gameDate');
        if (storedDate !== this.gameDate) {
            this.resetGameState();
            LocalStorageManager.set('gameDate', this.gameDate);
        }
    }

    resetGameState() {
        this.gameGuessColors = [];
        this.gameGuessLetters = [];
        this.incorrectGuesses = 0;
        this.currentAttempt = 0;
        this.isGameOver = false;
        this.hintDisplayed = false;
        
        LocalStorageManager.remove('gameGuessColors');
        LocalStorageManager.remove('gameGuessLetters');
        LocalStorageManager.remove('incorrectGuesses');
        LocalStorageManager.remove('hintDisplayed');
    }

    restoreGameState() {
        this.gameGuessColors = LocalStorageManager.get('gameGuessColors', []);
        this.gameGuessLetters = LocalStorageManager.get('gameGuessLetters', []);
        this.incorrectGuesses = LocalStorageManager.get('incorrectGuesses', 0);
        this.hintDisplayed = LocalStorageManager.get('hintDisplayed', false);
        this.currentAttempt = this.gameGuessLetters.length;
        
        const gameProgress = LocalStorageManager.get('gameProgress', {});
        this.isGameOver = gameProgress.gameEnded || false;

        // Show hint if conditions are met
        if (this.incorrectGuesses >= CONFIG.HINT_THRESHOLD || this.isGameOver) {
            this.hintDisplayed = true;
            LocalStorageManager.set('hintDisplayed', true);
        }
    }

    normalizeWord(word) {
        const accentsMap = {
            'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a',
            'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
            'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
            'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o',
            'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
            'ñ': 'n', 'Ñ': 'N', 'ç': 'c', 'Ç': 'C'
        };

        return word
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .split('')
            .map(letter => accentsMap[letter] || letter)
            .join('')
            .toUpperCase();
    }

    handleGameLoadError(error) {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.innerHTML = "<span class='text-l'>Uh oh! No word for today.</span><br />Email <a href='mailto:jon@livingdead.co'>jon@livingdead.co</a> &amp; let him know.";
            errorMessage.style.display = 'block';
        }
    }
}

// ==================
// UI Controller
// ==================
class UIController {
    constructor() {
        this.elements = {
            gameBoard: document.getElementById('game-board'),
            keyboard: document.getElementById('keyboard'),
            hint: document.getElementById('hint'),
            hintText: document.getElementById('hint-text'),
            wordReveal: document.getElementById('word-reveal'),
            wordContent: document.getElementById('word-content'),
            context: document.getElementById('context'),
            contextText: document.getElementById('context-text'),
            errorMessage: document.getElementById('error-message'),
            copyConfirmation: document.getElementById('copy-confirmation'),
            completedMessage: document.getElementById('completed-message')
        };
        
        // Cache tile rows for better performance
        this.tileRows = Array.from(this.elements.gameBoard.querySelectorAll('.tile-row-wrapper'));
    }

    updateGameUI(word, hint, context) {
        if (this.elements.hintText) {
            this.elements.hintText.textContent = hint || '';
        }
        if (this.elements.wordContent) {
            this.elements.wordContent.textContent = word || '';
        }
        if (context && this.elements.context && this.elements.contextText) {
            this.elements.contextText.textContent = context;
            this.elements.context.style.display = 'block';
        } else if (this.elements.context) {
            this.elements.context.style.display = 'none';
        }
    }

    updateCurrentGuessDisplay(currentGuess, currentAttempt) {
        const currentRow = this.tileRows[currentAttempt];
        if (!currentRow) return;

        const tiles = currentRow.querySelectorAll('.tile');
        tiles.forEach((tile, index) => {
            const front = tile.querySelector('.front');
            if (front) {
                front.textContent = currentGuess[index] || '';
            }
        });
    }

    updateTiles(attempt, guess, result) {
        const row = this.tileRows[attempt];
        if (!row) return;

        const tiles = row.querySelectorAll('.tile');
        const allCorrect = result.every(status => status === 'correct');

        tiles.forEach((tile, index) => {
            const back = tile.querySelector('.back');
            const backText = tile.querySelector('.back-text');
            
            backText.textContent = guess[index];
            back.className = 'back ' + result[index];

            setTimeout(() => {
                tile.classList.add('flipped');

                if (allCorrect && index === tiles.length - 1) {
                    setTimeout(() => this.triggerWinAnimation(tiles), CONFIG.ANIMATION_DELAY);
                }
            }, index * CONFIG.ANIMATION_DELAY);
        });
    }

    triggerWinAnimation(tiles) {
        tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('tile-win-pop');
            }, index * 100);
        });
    }

    shakeCurrentRow(currentAttempt) {
        const row = this.tileRows[currentAttempt];
        if (row) {
            row.classList.add('shake');
            setTimeout(() => row.classList.remove('shake'), 800);
        }
    }

    updateKeyboard(guess, result, delay = 2500) {
        setTimeout(() => {
            guess.split('').forEach((letter, index) => {
                const key = this.elements.keyboard.querySelector(`.key[data-key='${letter}']`);
                if (!key) return;

                const status = result[index];
                if (status === 'correct' || 
                    (status === 'present' && !key.classList.contains('correct')) ||
                    (status === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present'))) {
                    
                    key.classList.remove('correct', 'present', 'absent');
                    key.classList.add(status);
                }
            });
        }, delay);
    }

    displayHint() {
        if (this.elements.hint) {
            this.elements.hint.style.display = 'block';
            // Force reflow
            void this.elements.hint.offsetWidth;
            this.elements.hint.style.opacity = '1';
            this.gameState.hintDisplayed = true;
            LocalStorageManager.set('hintDisplayed', true);
        }
    }

    revealWordOfTheDay(word) {
        if (this.elements.wordReveal && this.elements.wordContent) {
            this.elements.wordContent.textContent = word;
            this.elements.wordReveal.style.display = 'flex';
            setTimeout(() => {
                this.elements.wordReveal.style.opacity = '1';
            }, 100);
        }
    }

    toggleOnScreenKeyboard(enable) {
        const keys = this.elements.keyboard.querySelectorAll('.key');
        keys.forEach(button => {
            if (enable) {
                button.removeAttribute('disabled');
                button.classList.remove('disabled');
            } else {
                button.setAttribute('disabled', 'true');
                button.classList.add('disabled');
            }
        });
    }

    showCopyConfirmation() {
        if (this.elements.copyConfirmation) {
            this.elements.copyConfirmation.style.display = 'block';
            this.elements.copyConfirmation.style.opacity = '1';
            setTimeout(() => {
                this.elements.copyConfirmation.style.opacity = '0';
                setTimeout(() => {
                    this.elements.copyConfirmation.style.display = 'none';
                }, 600);
            }, 6000);
        }
    }

    displayEndGameMessage(won) {
        this.showEndGameUI();
        this.toggleOnScreenKeyboard(false);
        
        setTimeout(() => {
            const navButton = document.querySelector('.nav-button-default-state');
            if (navButton) {
                navButton.click();
            }
        }, 3500);
    }

    showEndGameUI() {
        document.querySelectorAll('.splatter-box').forEach(box => {
            box.style.display = 'block';
            setTimeout(() => box.style.opacity = '1', 10);
        });
    }

    restorePreviousGuesses(guessLetters, guessColors) {
        guessLetters.forEach((guess, attemptIndex) => {
            const result = guessColors[attemptIndex];
            this.updateTiles(attemptIndex, guess.join(''), result);
            this.updateKeyboard(guess.join(''), result, 0); // Immediate update for keyboard
        });
    }
}

// ===================
// Stats Manager Class
// ===================
class StatsManager {
    constructor() {
        this.defaultStats = {
            gamesPlayed: 0,
            wins: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
            lastGameWon: false,
            lastWinGuesses: null,
            lastPlayedDate: null
        };
        this.stats = this.loadStats();
        this.displayStats(); // Display stats immediately on construction
    }

    loadStats() {
        return LocalStorageManager.get('stats', this.defaultStats);
    }

    saveStats() {
        LocalStorageManager.set('stats', this.stats);
    }

    updateStats(win, guessesTaken, gameDate) {
        this.stats.gamesPlayed += 1;
        
        if (win) {
            this.stats.wins += 1;
            this.stats.currentStreak += 1;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
            this.stats.guessDistribution[guessesTaken] += 1;
            this.stats.lastGameWon = true;
            this.stats.lastWinGuesses = guessesTaken;
        } else {
            this.stats.currentStreak = 0;
            this.stats.lastGameWon = false;
        }
        
        this.stats.lastPlayedDate = gameDate;
        LocalStorageManager.set('gameOutcome', win ? 'won' : 'lost');
        this.saveStats();
        this.displayStats();
    }

    displayStats() {
        const elements = {
            gamesPlayed: document.getElementById('games-played'),
            winPercentage: document.getElementById('win-percentage'),
            currentStreak: document.getElementById('current-streak'),
            maxStreak: document.getElementById('max-streak')
        };

        // Update basic stats
        if (elements.gamesPlayed) {
            elements.gamesPlayed.textContent = this.stats.gamesPlayed;
        }
        if (elements.winPercentage) {
            const percentage = this.stats.gamesPlayed > 0 
                ? Math.round((this.stats.wins / this.stats.gamesPlayed) * 100) 
                : 0;
            elements.winPercentage.textContent = `${percentage}%`;
        }
        if (elements.currentStreak) {
            elements.currentStreak.textContent = this.stats.currentStreak;
        }
        if (elements.maxStreak) {
            elements.maxStreak.textContent = this.stats.maxStreak;
        }

        // Update distribution graph
        this.updateDistributionGraph();
    }

    updateDistributionGraph() {
        const totalWins = Object.values(this.stats.guessDistribution)
            .reduce((acc, count) => acc + count, 0);

        Object.entries(this.stats.guessDistribution).forEach(([guess, count]) => {
            const bar = document.getElementById(`distribution-${guess}`);
            if (!bar) return;

            const percentage = totalWins > 0 ? (count / totalWins) * 100 : 0;
            bar.style.width = `${percentage}%`;
            bar.textContent = count;

            bar.classList.remove('correct');
            if (this.stats.lastGameWon && this.stats.lastWinGuesses.toString() === guess) {
                bar.classList.add('correct');
            }
        });
    }

    generateResultString(gameDate, guessColors) {
        const dateParts = gameDate.split('-');
        const month = parseInt(dateParts[1], 10);
        const day = parseInt(dateParts[2], 10);
        const formattedDate = `${month}/${day}`;

        const emojiMap = {
            'absent': '⬛',
            'present': '🟨',
            'correct': '🟥'
        };

        const resultString = guessColors
            .map(guess => guess.map(status => emojiMap[status]).join(''))
            .join('\n');

        return `www.horrordle.app, ${formattedDate}\n\n${resultString}`;
    }
}

// ====================
// Input Handler Class
// ====================
class InputHandler {
    constructor(gameState, uiController) {
        this.gameState = gameState;
        this.uiController = uiController;
        this.inputDisabled = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Virtual keyboard
        this.uiController.elements.keyboard.addEventListener('click', (e) => {
            if (e.target.matches('.key')) {
                const key = e.target.getAttribute('data-key');
                this.handleKeyInput(key);
            }
        });

        // Physical keyboard
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            if (e.key === 'Enter') {
                this.handleKeyInput('ENTER');
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this.handleKeyInput('BACKSPACE');
            } else {
                const key = e.key.toUpperCase();
                if (/^[A-Z]$/.test(key)) {
                    this.handleKeyInput(key);
                }
            }
        });

        // Share button
        const shareButton = document.getElementById('share-result');
        if (shareButton) {
            shareButton.addEventListener('click', () => this.handleShare());
        }
    }

    handleKeyInput(key) {
        if (this.inputDisabled || this.gameState.isGameOver) return;

        switch (key) {
            case 'ENTER':
                this.handleEnter();
                break;
            case 'BACKSPACE':
                this.handleBackspace();
                break;
            default:
                this.handleLetter(key);
        }
    }

    handleEnter() {
        if (this.gameState.currentGuess.length === CONFIG.WORD_LENGTH) {
            this.gameState.submitGuess();
        }
    }

    handleBackspace() {
        if (this.gameState.currentGuess.length > 0) {
            this.gameState.currentGuess.pop();
            this.uiController.updateCurrentGuessDisplay(
                this.gameState.currentGuess, 
                this.gameState.currentAttempt
            );
        }
    }

    handleLetter(key) {
        if (this.gameState.currentGuess.length < CONFIG.WORD_LENGTH) {
            this.gameState.currentGuess.push(key);
            this.uiController.updateCurrentGuessDisplay(
                this.gameState.currentGuess, 
                this.gameState.currentAttempt
            );
        }
    }

    async handleShare() {
        const resultString = this.gameState.statsManager.generateResultString(
            this.gameState.gameDate,
            this.gameState.gameGuessColors
        );

        try {
            await navigator.clipboard.writeText(resultString);
            this.uiController.showCopyConfirmation();
        } catch (err) {
            console.error('Failed to copy result to clipboard:', err);
        }
    }

    disableInput() {
        this.inputDisabled = true;
        this.uiController.toggleOnScreenKeyboard(false);
    }

    enableInput() {
        this.inputDisabled = false;
        this.uiController.toggleOnScreenKeyboard(true);
    }
}

// ====================
// Main Game Class
// ====================
class HorrordleGame {
    constructor() {
        this.gameState = new GameState();
        this.uiController = new UIController();
        this.statsManager = new StatsManager();
        this.inputHandler = new InputHandler(this.gameState, this.uiController);
        
        // Bind game state to other components
        this.gameState.statsManager = this.statsManager;
        this.gameState.uiController = this.uiController;
        
        // Display stats if game is already completed
        const gameProgress = LocalStorageManager.get('gameProgress', {});
        if (gameProgress.gameEnded) {
            this.statsManager.displayStats();
        }
    }

    async initialize() {
        await this.gameState.initialize();
        this.uiController.updateGameUI(
            this.gameState.wordOfTheDay,
            this.gameState.hintOfTheDay,
            this.gameState.contextOfTheDay
        );
        
        // Restore previous game state
        if (this.gameState.gameGuessLetters.length > 0) {
            this.uiController.restorePreviousGuesses(
                this.gameState.gameGuessLetters,
                this.gameState.gameGuessColors
            );
        }
        
        // Show hint if conditions are met
        if (this.gameState.incorrectGuesses >= CONFIG.HINT_THRESHOLD || this.gameState.isGameOver) {
            this.uiController.displayHint();
        }
        
        if (this.gameState.isGameOver) {
            this.inputHandler.disableInput();
            const lastGuess = this.gameState.gameGuessLetters[this.gameState.gameGuessLetters.length - 1];
            const won = lastGuess && lastGuess.join('') === this.gameState.wordOfTheDayNormalized;
            this.uiController.displayEndGameMessage(won);
            this.uiController.revealWordOfTheDay(this.gameState.wordOfTheDay);
        }

        // Add guess processing to game state
        this.gameState.submitGuess = () => this.processGuess();
        
        // Set up auto-refresh
        this.setupAutoRefresh();
    }

    processGuess() {
        if (this.gameState.isRevealingGuess || this.gameState.isGameOver || 
            this.gameState.currentGuess.length !== CONFIG.WORD_LENGTH) return;

        this.gameState.isRevealingGuess = true;
        const guess = this.gameState.normalizeWord(this.gameState.currentGuess.join(''));

        if (!this.gameState.dictionary.includes(guess)) {
            this.uiController.shakeCurrentRow(this.gameState.currentAttempt);
            this.gameState.isRevealingGuess = false;
            return;
        }

        if (guess !== this.gameState.wordOfTheDayNormalized) {
            this.gameState.incorrectGuesses++;
            LocalStorageManager.set('incorrectGuesses', this.gameState.incorrectGuesses);
        }

        const result = this.evaluateGuess(guess);
        this.updateGameState(guess, result);

        setTimeout(() => {
            this.checkGameConditions();
            if (!this.gameState.isGameOver) {
                this.finalizeGuess(guess);
            }
        }, this.gameState.currentGuess.length * CONFIG.ANIMATION_DELAY + 600);
    }

    evaluateGuess(guess) {
        const wordArray = this.gameState.wordOfTheDayNormalized.split('');
        const result = Array(CONFIG.WORD_LENGTH).fill('absent');
        
        // First pass: mark correct positions
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === this.gameState.wordOfTheDayNormalized[i]) {
                result[i] = 'correct';
                wordArray[i] = null;
            }
        }

        // Second pass: mark present positions
        for (let i = 0; i < guess.length; i++) {
            if (result[i] !== 'correct' && wordArray.includes(guess[i])) {
                result[i] = 'present';
                wordArray[wordArray.indexOf(guess[i])] = null;
            }
        }

        return result;
    }

    updateGameState(guess, result) {
        this.uiController.updateTiles(this.gameState.currentAttempt, guess, result);
        this.uiController.updateKeyboard(guess, result);
        this.gameState.gameGuessColors.push(result);
        this.gameState.gameGuessLetters.push(guess.split(''));
        
        LocalStorageManager.set('gameGuessColors', this.gameState.gameGuessColors);
        LocalStorageManager.set('gameGuessLetters', this.gameState.gameGuessLetters);
        
        this.gameState.currentAttempt++;
        this.saveGameProgress(guess, result);
    }

    checkGameConditions() {
        // Check hint threshold first
        if (this.gameState.incorrectGuesses >= CONFIG.HINT_THRESHOLD) {
            this.uiController.displayHint();
        }

        const isWin = this.gameState.currentGuess.join('') === this.gameState.wordOfTheDayNormalized;
        const isLoss = this.gameState.currentAttempt >= CONFIG.MAX_ATTEMPTS;

        if (isWin || isLoss) {
            this.concludeGame(isWin);
        }
    }

    concludeGame(won) {
        this.gameState.isGameOver = true;
        this.inputHandler.disableInput();
        
        let gameProgress = LocalStorageManager.get('gameProgress', {});
        if (!gameProgress.gameEnded) {
            gameProgress.gameEnded = true;
            LocalStorageManager.set('gameProgress', gameProgress);
            
            this.statsManager.updateStats(
                won,
                this.gameState.currentAttempt,
                this.gameState.gameDate
            );
        }

        // Always show hint and word on game end
        this.uiController.displayHint();
        this.uiController.revealWordOfTheDay(this.gameState.wordOfTheDay);
        this.uiController.displayEndGameMessage(won);
    }

    saveGameProgress(guess, result) {
        const gameProgress = {
            date: this.gameState.gameDate,
            attempts: [...(LocalStorageManager.get('gameProgress', {}).attempts || []), {
                guess,
                result,
                attemptNumber: this.gameState.currentAttempt - 1
            }],
            gameEnded: this.gameState.isGameOver
        };
        LocalStorageManager.set('gameProgress', gameProgress);
    }

    finalizeGuess(guess) {
        this.gameState.currentGuess = [];
        this.gameState.isRevealingGuess = false;
    }

    setupAutoRefresh() {
        // Refresh every 12 hours
        setInterval(() => {
            location.reload(true);
        }, 12 * 60 * 60 * 1000);
    }
}

// ======================
// Initialize Application
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    const game = new HorrordleGame();
    await game.initialize();

    // Show instructions for first-time visitors
    if (!LocalStorageManager.get('hasVisited')) {
        const instructionsElement = document.querySelector('.instructions');
        if (instructionsElement) {
            instructionsElement.style.display = 'block';
            setTimeout(() => instructionsElement.style.opacity = 1, 10);
        }
    }

    // Handle instructions dismiss
    const dismissBtn = document.querySelector('.instructions-dismiss');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', (e) => {
            e.preventDefault();
            LocalStorageManager.set('hasVisited', true);
        });
    }

    // Handle modal close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const statsCloseButton = document.querySelector('.nav-button-close-target');
            const rulesDismissButton = document.querySelector('.instructions-dismiss-ghost-button');
            
            if (statsCloseButton) statsCloseButton.click();
            if (rulesDismissButton) rulesDismissButton.click();
        }
    });
}); 