import { uiUpdater } from '../ui/uiUpdater.js';

class GameState {
    constructor() {
        this.dictionary = [];
        this.reset();
        this.incorrectGuessCount = 0;
        this.inputEnabled = true;
        // Initialize stats
        this.stats = {
            gamesPlayed: 0,
            wins: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
            lastPlayedDate: '',
        };

        // Ensure methods are bound to the instance
        this.saveStats = this.saveStats.bind(this);
        this.updateStats = this.updateStats.bind(this);
        this.endGame = this.endGame.bind(this);

        this.loadStats();
        this.loadGameDetails();
        // Directly display stats on page load
        uiUpdater.updateStatsDisplay(this.stats);

        const gameGuessColorsFromStorage = localStorage.getItem('gameGuessColors');
        if (gameGuessColorsFromStorage) {
            this.gameGuessColors = JSON.parse(gameGuessColorsFromStorage);
        } else {
            // Initialize gameGuessColors to a default value if not found in localStorage
        }

        const gameGuessLettersFromStorage = localStorage.getItem('gameGuessLetters');
        if (gameGuessLettersFromStorage) {
            this.gameGuessLetters = JSON.parse(gameGuessLettersFromStorage);
        } else {
            // Initialize gameGuessLetters to a default value if not found in localStorage
        }

        this.loadGameState();

    }

    init() {
    // Now it's safe to use uiUpdater since this method will be called later
    uiUpdater.updateStatsDisplay(this.stats);
    }

    reset() {
        this.currentAttempt = 0;
        this.maxAttempts = 6;
        this.isGameOver = false;
        this.wordOfTheDay = '';
        this.hintOfTheDay = '';
        this.guesses = [];
        this.currentGuess = [];
    }

    loadGameDetails() {
        const gameDate = localStorage.getItem('gameDate');
        const today = new Date().toISOString().slice(0, 10);

        if (gameDate === today) {
            // Logic to handle already played game...
            this.restoreGameState();
        } else {
            // Reset or start new game logic...
        }
    }

    loadGameState() {
        const gameGuessLetters = localStorage.getItem('gameGuessLetters');
        const gameGuessColors = localStorage.getItem('gameGuessColors');

        this.gameGuessLetters = gameGuessLetters ? JSON.parse(gameGuessLetters) : [];
        this.gameGuessColors = gameGuessColors ? JSON.parse(gameGuessColors) : [];

        // Handle other state loading here...
    }

    startNewGame(wordOfTheDay, hintOfTheDay, dictionary) {
        this.reset(); // Reset the game state for a new game
        this.wordOfTheDay = wordOfTheDay.toUpperCase();
        this.hintOfTheDay = hintOfTheDay;
        this.dictionary = dictionary; // Assuming the dictionary is passed here or loaded before calling this method
    }

    removeLastLetter() {
        this.currentGuess.pop();
    }

    submitGuess(guess, uiUpdater) {
        // Validate the guess
        if (!this.isValidGuess(guess)) {
            uiUpdater.showInvalidGuessMessage();
            uiUpdater.shakeCurrentRow(this.currentAttempt);
            return;
        }

        // Save the guess letters
        this.gameGuessLetters.push([...guess]); // Spread the guess into an array of its characters

        guess = guess.toUpperCase();
        this.guesses.push(guess);
        const result = this.compareGuess(guess);
        this.gameGuessColors.push(result);

        localStorage.setItem('gameGuessLetters', JSON.stringify(this.gameGuessLetters));
        localStorage.setItem('gameGuessColors', JSON.stringify(this.gameGuessColors));

        // Increment attempt count
        this.currentAttempt++;

        // Check if the guess is incorrect
        if (guess !== this.wordOfTheDay) {
            this.incorrectGuessCount++;
        }

        // Update UI with the guess result
        uiUpdater.markGuessResult(this.currentAttempt - 1, guess, result); // Adjust to currentAttempt - 1 if needed

        // Reveal hint after 5 incorrect guesses
        if (this.incorrectGuessCount >= 5 && !this.hintDisplayed) {
            uiUpdater.showHint(this.hintOfTheDay);
            this.hintDisplayed = true;
        }

        // Game over logic
        if (guess === this.wordOfTheDay || this.currentAttempt >= this.maxAttempts) {
            this.endGame(guess === this.wordOfTheDay, uiUpdater);
        } else {
            // Prepare for the next guess
            this.currentGuess = [];
        }
    }

    compareGuess(guess) {
        const result = guess.split('').map((letter, index) => {
            if (letter === this.wordOfTheDay[index]) {
                return 'correct';
            } else if (this.wordOfTheDay.includes(letter)) {
                return 'present';
            } else {
                return 'absent';
            }
        });

        return result;
    }

    isValidGuess(guess) {
        // Check if dictionary is defined and is an array
        if (!Array.isArray(this.dictionary)) {
            console.error("Dictionary is not loaded or not an array.");
            return false; // Or handle this scenario as needed
        }
        return this.dictionary.includes(guess.toUpperCase());
    }

    isCorrectGuess(guess) {
        return guess.toUpperCase() === this.wordOfTheDay;
    }

    getRemainingAttempts() {
        return this.maxAttempts - this.currentAttempt;
    }

    getGameStatus() {
        const lastGuess = this.guesses[this.guesses.length - 1];
        return {
            isGameOver: this.isGameOver,
            won: lastGuess ? this.isCorrectGuess(lastGuess) : false,
            remainingAttempts: this.getRemainingAttempts(),
        };
    }

    updateCurrentGuess(letter) {
        // Ensure the current guess doesn't exceed the maximum length (e.g., 5 for Wordle)
        if (this.currentGuess.length < 5) {
            this.currentGuess.push(letter);
        }
    }

    isInputEnabled() {
        return this.inputEnabled;
    }

    prepareNextAttempt() {
        // Logic to prepare for the next guess attempt
        // For example, this could reset the currentGuess array for a new guess:
        this.currentGuess = [];
        
        // And potentially other preparation logic...
    }

    restoreGameState() {
        // Load stored game state from localStorage
        const gameOutcome = localStorage.getItem('gameOutcome'); // 'won', 'lost', or null if the game wasn't completed
        const gameGuessLetters = JSON.parse(localStorage.getItem('gameGuessLetters') || '[]');
        const gameGuessColors = JSON.parse(localStorage.getItem('gameGuessColors') || '[]');

        // Restore guesses and their outcomes to the game state
        this.guesses = gameGuessLetters;
        this.guessOutcome = gameGuessColors; // Make sure to adapt this to how you're tracking guess results in your state

        // Replay the restored guesses on the UI
        this.replayGuesses(gameGuessLetters, gameGuessColors);

        // If the game was completed, disable further input and show the outcome
        if (gameOutcome) {
            this.isGameOver = true;
            this.disableInput();

            const won = gameOutcome === 'won';
            // Since this logic is running on page load, consider delaying UI updates slightly to ensure the DOM is ready
            setTimeout(() => {
                uiUpdater.showEndGameMessage(won, this.wordOfTheDay, this.hintOfTheDay);
                // Optionally, also refresh the stats display
                uiUpdater.updateStatsDisplay(this.stats);
            }, 0);
        }
    }

    replayGuesses(guessLetters, guessColors) {
        guessLetters.forEach((letters, attemptIndex) => {
            // Assuming there's a way to select each row based on the attempt index
            const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${attemptIndex}"]`);
            if (!currentRow) return;

            const tiles = currentRow.querySelectorAll('.tile');
            letters.forEach((letter, letterIndex) => {
                if (tiles[letterIndex]) {
                    const tile = tiles[letterIndex];
                    const front = tile.querySelector('.front');
                    const back = tile.querySelector('.back');
                    const backText = tile.querySelector('.back-text');

                    // Set the letter on both sides of the tile
                    front.textContent = letter;
                    backText.textContent = letter;

                    // Add the result class to the .back element
                    const resultClass = guessColors[attemptIndex][letterIndex];
                    back.classList.add(resultClass);

                    // Immediately flip the tiles without delay
                    tile.classList.add('flipped');
                }
            });
        });
    }

    loadStats() {
        const statsFromStorage = localStorage.getItem('stats');
        if (statsFromStorage) {
            this.stats = JSON.parse(statsFromStorage);
        }
    }

    saveStats() {
        localStorage.setItem('stats', JSON.stringify(this.stats));
    }

    updateStats(won, guessCount) {
        const today = new Date().toISOString().slice(0, 10);
        this.stats.gamesPlayed++;
        this.stats.lastPlayedDate = today;

        if (won) {
            this.stats.wins++;
            this.stats.lastWinGuesses = guessCount;
            this.stats.lastGameWon = true;
            this.stats.guessDistribution[guessCount] = (this.stats.guessDistribution[guessCount] || 0) + 1;
            // Update streaks
            this.stats.currentStreak = (this.stats.lastPlayedDate === today) ? this.stats.currentStreak + 1 : 1;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
        } else {
            this.stats.lastGameWon = false;
            this.stats.currentStreak = 0;
        }

        this.saveStats();
    }

    endGame(won, uiUpdater) {

        // Update game outcome
        const gameOutcome = won ? "won" : "lost";
        localStorage.setItem('gameOutcome', gameOutcome);

        // Save the game date
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('gameDate', today);

        const gameGuessLetters = this.guesses;
        const gameGuessColors = this.guesses.map(guess => this.compareGuess(guess));

        localStorage.setItem('gameGuessLetters', JSON.stringify(gameGuessLetters));
        localStorage.setItem('gameGuessColors', JSON.stringify(gameGuessColors));

        // Update stats and save them
        this.updateStats(won, this.currentAttempt);

        // Save updated stats to localStorage immediately after updating
        this.saveStats();

        this.isGameOver = true;

        // Disable further input as game is over
        this.disableInput();

        // Use a delay to allow for animations or other UI updates before showing the end game message
        setTimeout(() => {
            uiUpdater.showEndGameMessage(won, this.wordOfTheDay, this.hintOfTheDay);
            // Refresh stats UI
            uiUpdater.updateStatsDisplay(this.stats);
        }, 2500);
    }

    disableInput() {
        this.inputEnabled = false;
    }

}

// Export the GameState class for use in other modules
export const gameState = new GameState();