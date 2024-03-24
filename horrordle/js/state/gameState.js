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
        this.currentGuess = []; // Initialize the current guess as an empty array
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

        // Reset currentGuess after submitting
        this.currentGuess = [];
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

    removeLastLetter() {
        this.currentGuess.pop();
    }
}

// Export the GameState class for use in other modules
export const gameState = new GameState();
