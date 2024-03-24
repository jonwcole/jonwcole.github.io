class GameState {
    constructor() {
        this.dictionary = []; // Ensure this is populated as needed, e.g., via an initialization method
        this.reset();
    }

    reset() {
        this.currentAttempt = 0;
        this.maxAttempts = 6;
        this.isGameOver = false;
        this.wordOfTheDay = '';
        this.hintOfTheDay = '';
        this.guesses = [];
        this.currentGuess = []; // Initialize the current guess as an empty array
    }

    startNewGame(wordOfTheDay, hintOfTheDay, dictionary) {
        this.reset(); // Reset the game state for a new game
        this.wordOfTheDay = wordOfTheDay.toUpperCase();
        this.hintOfTheDay = hintOfTheDay;
        this.dictionary = dictionary; // Assuming the dictionary is passed here or loaded before calling this method
    }

    submitGuess(guess, uiUpdater) {
        if (!this.isValidGuess(guess)) {
            uiUpdater.showInvalidGuessMessage(); // This method needs to be defined in uiUpdater
            return; // Stop processing this guess
        }

        guess = guess.toUpperCase();
        this.guesses.push(guess);
        const result = this.compareGuess(guess);

        // UI update based on the comparison
        uiUpdater.markGuessResult(this.currentAttempt, guess, result);

        if (guess === this.wordOfTheDay) {
            this.isGameOver = true;
            uiUpdater.showEndGameMessage(true, this.wordOfTheDay);
        } else if (this.currentAttempt >= this.maxAttempts - 1) {
            this.isGameOver = true;
            uiUpdater.showEndGameMessage(false, this.wordOfTheDay);
        }

        this.currentAttempt++;
        this.currentGuess = []; // Reset for the next guess
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

    prepareNextAttempt() {
        // Logic to prepare for the next guess attempt
        // For example, this could reset the currentGuess array for a new guess:
        this.currentGuess = [];
        
        // And potentially other preparation logic...
    }

    removeLastLetter() {
        this.currentGuess.pop();
    }
}

// Export the GameState class for use in other modules
export const gameState = new GameState();
