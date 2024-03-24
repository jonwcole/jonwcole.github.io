class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentAttempt = 0;
        this.maxAttempts = 6;
        this.isGameOver = false;
        this.wordOfTheDay = '';
        this.hintOfTheDay = '';
        this.guesses = [];
    }

    startNewGame(wordOfTheDay, hintOfTheDay) {
        this.reset(); // Reset the game state for a new game
        this.wordOfTheDay = wordOfTheDay.toUpperCase();
        this.hintOfTheDay = hintOfTheDay;
    }

    submitGuess(guess) {
        // Ensure guess is in uppercase for consistency
        guess = guess.toUpperCase();

        // Add guess to the list of guesses
        this.guesses.push(guess);

        // Increment attempt counter
        this.currentAttempt++;

        // Check if the guess is correct or if the player has reached the max attempts
        if (guess === this.wordOfTheDay || this.currentAttempt >= this.maxAttempts) {
            this.isGameOver = true;
        }
    }

    isCorrectGuess(guess) {
        return guess.toUpperCase() === this.wordOfTheDay;
    }

    getRemainingAttempts() {
        return this.maxAttempts - this.currentAttempt;
    }

    getGameStatus() {
        return {
            isGameOver: this.isGameOver,
            won: this.isCorrectGuess(this.guesses[this.guesses.length - 1]),
            remainingAttempts: this.getRemainingAttempts(),
        };
    }
}

// Export the GameState class for use in other modules
export const gameState = new GameState();
