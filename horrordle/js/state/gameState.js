class GameState {
    constructor() {
        this.dictionary = []; // Ensure this is populated as needed, e.g., via an initialization method
        this.reset();
        this.incorrectGuessCount = 0;
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
            uiUpdater.showInvalidGuessMessage(); // Show a message for an invalid guess
            // If the guess is invalid, you might decide whether or not to count it towards the incorrect guess limit
            return; // Stop processing this guess further
        }

        guess = guess.toUpperCase(); // Normalize the guess to uppercase
        this.guesses.push(guess); // Add the guess to the list of attempts
        const result = this.compareGuess(guess); // Determine the result of the guess (correct, present, absent)

        // Update the UI based on the comparison result
        uiUpdater.markGuessResult(this.currentAttempt, guess, result);

        // Increment incorrect guess count only if the guess is wrong and not equal to the word of the day
        if (guess !== this.wordOfTheDay) {
            this.incorrectGuessCount++;
        }

        // Reveal the hint if the player has made 5 incorrect guesses
        if (this.incorrectGuessCount >= 5) {
            uiUpdater.showHint(this.hintOfTheDay); // This assumes uiUpdater.showHint correctly handles displaying the hint
        }

        // Handle game over conditions: player wins or runs out of attempts
        if (guess === this.wordOfTheDay) {
            this.isGameOver = true;
            uiUpdater.showEndGameMessage(true, this.wordOfTheDay); // Player wins
        } else if (this.currentAttempt >= this.maxAttempts - 1) {
            this.isGameOver = true;
            uiUpdater.showEndGameMessage(false, this.wordOfTheDay); // Game over, player didn't guess the word
        }

        this.currentAttempt++; // Move to the next attempt
        this.currentGuess = []; // Prepare for the next guess
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
