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
        guess = guess.toUpperCase();
        this.guesses.push(guess);
        this.currentAttempt++;
        
        // Directly evaluate and react to the guess here
        this.compareGuess(guess); // Now, compareGuess does UI updates and checks win condition
        
        if (this.currentAttempt >= this.maxAttempts || guess === this.wordOfTheDay) {
            this.isGameOver = true;
        }

        this.currentGuess = []; // Prepare for next attempt
    }

    compareGuess(guess, uiUpdater) {
        // Compare `guess` with `gameState.wordOfTheDay`
        // Update UI to reflect how many letters are correct/placed correctly
        const result = guess.split('').map((letter, index) => {
            if (letter === gameState.wordOfTheDay[index]) {
                return 'correct';
            } else if (gameState.wordOfTheDay.includes(letter)) {
                return 'present';
            } else {
                return 'absent';
            }
        });

        // Assuming you have a function in uiUpdater to mark guess results
        uiUpdater.markGuessResult(this.currentAttempt, guess, result);
        // Check if the game has been won or if max attempts reached, and update the game state accordingly
        if (guess === gameState.wordOfTheDay) {
            // Handle win
            gameState.winGame();
            uiUpdater.showEndGameMessage(true, gameState.wordOfTheDay);
        } else if (gameState.currentAttempt >= gameState.maxAttempts) {
            // Handle loss
            gameState.endGame();
            uiUpdater.showEndGameMessage(false, gameState.wordOfTheDay);
        } else {
            // Prepare for next attempt
            gameState.prepareNextAttempt();
        }
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
