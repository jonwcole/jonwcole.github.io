// =====================
// Constants and Config
// =====================
const CONFIG = {
    MAX_ATTEMPTS: 6,
    WORD_LENGTH: 5,
    HINT_THRESHOLD: 5,
    ANIMATION_DELAY: 500,
    URLS: {
        DICTIONARY: 'https://jonwcole.github.io/horrordle/dictionary-v2.0.json',
        WORDS: 'https://jonwcole.github.io/horrordle/words-v2.0.json'
    }
};

// =================
// Utility Classes
// =================
class LocalStorageManager {
    static memoryStorage = {};

    static isAvailable() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            console.warn('LocalStorage is not available:', e);
            return false;
        }
    }

    static validateJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            // Basic schema validation for stats object
            if (jsonString.includes('"stats"')) {
                const requiredKeys = ['gamesPlayed', 'wins', 'currentStreak', 'maxStreak', 'guessDistribution'];
                if (!requiredKeys.every(key => key in parsed)) {
                    console.error('Invalid stats object structure');
                    return null;
                }
            }
            return parsed;
        } catch (e) {
            console.error('Invalid JSON:', e);
            return null;
        }
    }

    static get(key, defaultValue = null) {
        try {
            if (!this.isAvailable()) {
                return this.memoryStorage[key] || defaultValue;
            }
            const value = localStorage.getItem(key);
            if (!value) return defaultValue;
            
            const validated = this.validateJSON(value);
            if (validated === null) {
                console.warn(`Invalid data for ${key}, using default value`);
                return defaultValue;
            }
            return validated;
        } catch (error) {
            console.error(`Error reading ${key} from storage:`, error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            const jsonValue = JSON.stringify(value);
            if (!this.isAvailable()) {
                this.memoryStorage[key] = value;
                return;
            }
            localStorage.setItem(key, jsonValue);
        } catch (error) {
            console.error(`Error writing ${key} to storage:`, error);
            this.memoryStorage[key] = value; // Fallback to memory storage
        }
    }

    static remove(key) {
        try {
            if (!this.isAvailable()) {
                delete this.memoryStorage[key];
                return;
            }
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from storage:`, error);
        }
    }

    static clear() {
        try {
            if (!this.isAvailable()) {
                this.memoryStorage = {};
                return;
            }
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
}

class HapticFeedback {
    static isAvailable() {
        return 'vibrate' in navigator;
    }

    static light() {
        if (this.isAvailable()) {
            navigator.vibrate(10);
        }
    }

    static medium() {
        if (this.isAvailable()) {
            navigator.vibrate(20);
        }
    }

    static heavy() {
        if (this.isAvailable()) {
            navigator.vibrate([30, 30, 30]);
        }
    }

    static error() {
        if (this.isAvailable()) {
            navigator.vibrate([50, 50, 50]);
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
        try {
            // Load dictionary and words
            const [dictionary, words] = await Promise.all([
                this.loadDictionary(),
                this.loadWords()
            ]).catch(error => {
                throw new Error('Failed to load game data. Please check your internet connection.');
            });
            
            this.dictionary = dictionary;
            const today = this.getCurrentDate();
            const wordData = words[today];
            
            if (!wordData) {
                throw new Error('No word available for today. Please try again later.');
            }

            // Get saved game progress
            const gameProgress = LocalStorageManager.get('gameProgress', {});
            
            // Check if the saved game is from a different day
            if (gameProgress.date !== today) {
                // Reset game state for new day
                this.resetGameState();
                LocalStorageManager.set('gameProgress', { date: today });
            } else {
                // Restore previous game state
                this.gameGuessLetters = LocalStorageManager.get('gameGuessLetters', []);
                this.gameGuessColors = LocalStorageManager.get('gameGuessColors', []);
                this.currentAttempt = this.gameGuessLetters.length;
                this.incorrectGuesses = LocalStorageManager.get('incorrectGuesses', 0);
                this.isGameOver = gameProgress.gameEnded || false;
            }

            // Set up today's word
            this.wordOfTheDay = wordData.word.toUpperCase();
            this.wordOfTheDayNormalized = this.normalizeWord(this.wordOfTheDay);
            this.hintOfTheDay = wordData.hint;
            this.contextOfTheDay = wordData.context;
            this.gameDate = today;

        } catch (error) {
            console.error('Error initializing game:', error);
            this.handleGameLoadError(error);
            throw error;
        }
    }

    async loadDictionary() {
        try {
            const dictionaryResponse = await fetch(CONFIG.URLS.DICTIONARY);
            return (await dictionaryResponse.json()).map(word => word.toUpperCase());
        } catch (error) {
            console.error('Error loading dictionary:', error);
            throw error;
        }
    }

    async loadWords() {
        try {
            const wordsResponse = await fetch(CONFIG.URLS.WORDS);
            return await wordsResponse.json();
        } catch (error) {
            console.error('Error loading words:', error);
            throw error;
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

    resetGameState() {
        this.gameGuessLetters = [];
        this.gameGuessColors = [];
        this.currentAttempt = 0;
        this.currentGuess = [];
        this.incorrectGuesses = 0;
        this.isGameOver = false;
        this.isRevealingGuess = false;
        this.hintDisplayed = false;
        
        // Clear localStorage
        LocalStorageManager.remove('gameGuessLetters');
        LocalStorageManager.remove('gameGuessColors');
        LocalStorageManager.remove('incorrectGuesses');
        LocalStorageManager.remove('hintDisplayed');
        LocalStorageManager.set('gameProgress', {});
    }

    handleGameLoadError(error) {
        // Update UI to show error state
        const errorMessage = document.getElementById('error-message');
        const gameBoard = document.getElementById('game-board');
        const keyboard = document.getElementById('keyboard');
        const logoWrapper = document.querySelector('.logo-wrapper');
        
        if (errorMessage) {
            errorMessage.innerHTML = `There was an error retrieving the word of the day. Please e-mail <a href="mailto:jon@livingdead.co?subject=Horrordle%20Error" class="text---green-400">jon@livingdead.co</a>.`;
            errorMessage.style.display = 'block';
            errorMessage.style.opacity = '1';
        }

        // Disable game interface
        if (gameBoard) gameBoard.style.opacity = '0.5';
        if (keyboard) keyboard.style.opacity = '0.5';
        if (logoWrapper) logoWrapper.style.opacity = '0.5';
        
        // Disable input
        this.isGameOver = true;
        
        // Save error state
        LocalStorageManager.set('errorState', {
            date: new Date().toISOString(),
            error: error.message
        });
    }

    getCurrentDate() {
        const now = new Date();
        // Format parts individually to ensure YYYY-MM-DD format
        const year = now.toLocaleString('en-US', { year: 'numeric', timeZone: 'America/New_York' });
        const month = now.toLocaleString('en-US', { month: '2-digit', timeZone: 'America/New_York' });
        const day = now.toLocaleString('en-US', { day: '2-digit', timeZone: 'America/New_York' });
        
        // Combine in YYYY-MM-DD format
        return `${year}-${month}-${day}`;
    }
}

// ==================
// UI Controller
// ==================
class UIController {
    static ANIMATION_TIMINGS = {
        MODAL_FADE: 300,  // Reduced from 600ms
        MODAL_INIT: 10,
        COMPLETED_DELAY: 1500  // Show completed message after animations finish
    };

    constructor(gameState) {
        this.gameState = gameState;
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
            completedMessage: document.getElementById('completed-message'),
            shareButton: document.getElementById('share-result')
        };
        
        // Cache tile rows for better performance
        this.tileRows = Array.from(this.elements.gameBoard.querySelectorAll('.tile-row-wrapper'));
        this.setupModalListeners();
        
        // Disable share button initially
        this.toggleShareButton(false);
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
            HapticFeedback.error();
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
            if (this.gameState) {
                this.gameState.hintDisplayed = true;
                LocalStorageManager.set('hintDisplayed', true);
            }
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
        this.toggleShareButton(true); // Enable share button when game ends
        
        // Show hint and word reveal first
        this.displayHint();
        this.revealWordOfTheDay(this.gameState.wordOfTheDay);
        
        // Then show stats after a delay
        setTimeout(() => {
            const navButton = document.querySelector('.nav-button-default-state');
            if (navButton) {
                navButton.click();
            }
        }, 3500);
    }

    showEndGameUI(isWin, word, context) {
        // Show splatter boxes
        document.querySelectorAll('.splatter-box').forEach(box => {
            box.style.display = 'block';
            setTimeout(() => box.style.opacity = '1', 10);
        });

        // Show completed message
        if (this.elements.completedMessage) {
            this.elements.completedMessage.style.display = 'flex';
        }
    }

    hideCompletedMessage() {
        if (this.elements.completedMessage) {
            this.elements.completedMessage.style.display = 'none';
        }
    }

    restorePreviousGuesses(guessLetters, guessColors) {
        guessLetters.forEach((guess, attemptIndex) => {
            const result = guessColors[attemptIndex];
            this.updateTiles(attemptIndex, guess.join(''), result);
            this.updateKeyboard(guess.join(''), result, 0); // Immediate update for keyboard
        });
    }

    setupModalListeners() {
        // Instructions modal
        const instructionsButton = document.querySelector('.instructions-button');
        const instructionsDismiss = document.querySelector('.instructions-dismiss');
        const instructionsModal = document.querySelector('.instructions');

        if (instructionsButton && instructionsModal) {
            instructionsButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleModal(instructionsModal);
            });
        }

        if (instructionsDismiss && instructionsModal) {
            instructionsDismiss.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal(instructionsModal);
            });
        }

        // Stats modal
        const statsButton = document.querySelector('.nav-button-default-state');
        const statsModal = document.querySelector('.stats');

        if (statsButton && statsModal) {
            statsButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleModal(statsModal, statsButton);
            });
        }

        // Handle Escape key for both modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (instructionsModal?.classList.contains('modal-visible')) {
                    this.hideModal(instructionsModal);
                }
                if (statsModal?.classList.contains('modal-visible')) {
                    this.hideModal(statsModal, statsButton);
                }
            }
        });
    }

    toggleModal(modal, button = null) {
        if (modal.classList.contains('modal-visible')) {
            this.hideModal(modal, button);
        } else {
            this.showModal(modal, button);
        }
    }

    showModal(modal, button = null) {
        requestAnimationFrame(() => {
            modal.style.display = button ? 'flex' : 'block';
            if (button) button.classList.add('nav-button-active');
            setTimeout(() => modal.classList.add('modal-visible'), UIController.ANIMATION_TIMINGS.MODAL_INIT);
        });
    }

    hideModal(modal, button = null) {
        requestAnimationFrame(() => {
            modal.classList.remove('modal-visible');
            if (button) button.classList.remove('nav-button-active');
            setTimeout(() => modal.style.display = 'none', UIController.ANIMATION_TIMINGS.MODAL_FADE);
        });
    }

    toggleShareButton(enable) {
        if (this.elements.shareButton) {
            if (enable) {
                this.elements.shareButton.removeAttribute('disabled');
                this.elements.shareButton.classList.remove('disabled');
            } else {
                this.elements.shareButton.setAttribute('disabled', 'true');
                this.elements.shareButton.classList.add('disabled');
            }
        }
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
        this.displayStats();
    }

    loadStats() {
        return LocalStorageManager.get('stats', this.defaultStats);
    }

    saveStats() {
        LocalStorageManager.set('stats', this.stats);
    }

    updateStats(win, guessesTaken, gameDate) {
        // Backup stats before any update
        LocalStorageManager.set('stats_backup', this.stats);
        LocalStorageManager.set('last_backup_date', new Date().toISOString());
        
        // Now update the stats
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

        return `www.horrordle.app BETA, ${formattedDate}\n\n${resultString}`;
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
                HapticFeedback.medium();
                this.handleEnter();
                break;
            case 'BACKSPACE':
                HapticFeedback.light();
                this.handleBackspace();
                break;
            default:
                HapticFeedback.light();
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
        this.uiController = new UIController(this.gameState);
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
            
            // Show end game UI in proper sequence
            this.uiController.displayEndGameMessage(won);
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

        // Display end game UI elements in sequence
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

    disableGame() {
        if (this.inputHandler) {
            this.inputHandler.isInputEnabled = false;
        }
        // Optionally add visual indicators that game is disabled
        document.getElementById('game-board').style.opacity = '0.5';
        document.getElementById('keyboard').style.opacity = '0.5';
    }
}

// ======================
// Initialize Application
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    // Check for stats restoration parameter first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('restore')) {
        const backupStats = LocalStorageManager.get('stats_backup');
        if (backupStats) {
            // Clear current game progress
            LocalStorageManager.remove('gameProgress');
            LocalStorageManager.remove('gameOutcome');
            
            // Restore the backup stats
            LocalStorageManager.set('stats', backupStats);
            
            // Show error message with proper visibility
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.innerHTML = 'Your previous stats have been restored. <a class="text---green-400" href="/">Click here</a> to reload the game.';
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.classList.add('modal-visible');
                }, 10);
            }
            
            // Remove restore parameter from URL
            window.history.replaceState({}, '', window.location.pathname);
            
            // Disable game board and keyboard
            const gameBoard = document.getElementById('game-board');
            const keyboard = document.getElementById('keyboard');
            if (gameBoard) gameBoard.style.opacity = '0.5';
            if (keyboard) keyboard.style.opacity = '0.5';
            
            // Initialize StatsManager to display restored stats
            const statsManager = new StatsManager();
            
            return; // Don't initialize rest of game
        }
    }

    // Normal game initialization
    const game = new HorrordleGame();
    window.game = game;
    await game.initialize();

    // Show instructions for first-time visitors
    if (!LocalStorageManager.get('hasVisited')) {
        const instructionsElement = document.querySelector('.instructions');
        if (instructionsElement) {
            instructionsElement.style.display = 'block';
            setTimeout(() => instructionsElement.classList.add('modal-visible'), 10);
        }
    }

    // Handle instructions dismiss via click
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
            if (rulesDismissButton) {
                rulesDismissButton.click();
                LocalStorageManager.set('hasVisited', true);
            }
        }
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HorrordleGame, GameState, UIController, InputHandler, StatsManager };
} else if (typeof window !== 'undefined') {
    window.HorrordleGame = HorrordleGame;
    window.GameState = GameState;
    window.UIController = UIController;
    window.InputHandler = InputHandler;
    window.StatsManager = StatsManager;
} 