class GameState {
    constructor() {
        this.dictionary = []; // Ensure this is populated as needed, e.g., via an initialization method
        this.reset();
        this.incorrectGuessCount = 0;
        this.inputEnabled = true;
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

    removeLastLetter() {
        this.currentGuess.pop();
    }

    submitGuess(guess, uiUpdater) {
        // First, check if the guess is a valid word in the dictionary
        if (!this.isValidGuess(guess)) {
            uiUpdater.showInvalidGuessMessage(); // Display message for invalid guess
            uiUpdater.shakeCurrentRow(this.currentAttempt); // Shake the current row as feedback for invalid guess
            return; // Stop further processing of this guess
        }

        guess = guess.toUpperCase(); // Normalize the guess to uppercase
        this.guesses.push(guess); // Record the guess

        // Compare the guess to the word of the day and get the result
        const result = this.compareGuess(guess);

        // Increment the attempt count and incorrect guess count if necessary
        this.currentAttempt++;
        if (guess !== this.wordOfTheDay) {
            this.incorrectGuessCount++;
        }

        // Update the UI with the result of the guess
        // Note: Passing the gameState reference might not be necessary unless the uiUpdater needs to access gameState directly
        uiUpdater.markGuessResult(this.currentAttempt - 1, guess, result, this); // Adjusted to pass gameState if needed

        // Reveal the hint if 5 incorrect guesses have been made
        if (this.incorrectGuessCount >= 5 && !this.hintDisplayed) {
            uiUpdater.showHint(this.hintOfTheDay);
            this.hintDisplayed = true;
        }

        // Check for game over conditions
        if (guess === this.wordOfTheDay || this.currentAttempt >= this.maxAttempts) {
            this.isGameOver = true;
            const won = guess === this.wordOfTheDay;

            // Determine the delay after which the end game message should be shown
            const revealDelay = result.length * 500 + 500; // Assuming a 500ms flip delay per tile, plus an extra 500ms buffer

            setTimeout(() => {
                uiUpdater.showEndGameMessage(won, this.wordOfTheDay);
            }, revealDelay); // Delay showing the end game message until after the last tile has flipped
            
        } else {
            // Prepare for the next guess if the game is not over
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

    disableInput() {
        this.inputEnabled = false;
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
}

// Export the GameState class for use in other modules
export const gameState = new GameState();