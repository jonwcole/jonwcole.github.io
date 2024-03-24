import { gameState } from '../state/gameState.js';

const uiUpdater = {
    updateGuessDisplay() {
        // Utilizes gameState to access the currentAttempt and currentGuess
        const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${gameState.currentAttempt}"]`);
        
        if (!currentRow) {
            console.error('Current row not found:', gameState.currentAttempt);
            return;
        }

        const tiles = currentRow.querySelectorAll('.tile');

        // Clear existing letters in the current row's tiles before setting new ones
        tiles.forEach((tile, index) => {
            const front = tile.querySelector('.front');
            const backText = tile.querySelector('.back-text');
            // Reset content for both front and back-text
            front.textContent = gameState.currentGuess[index] || '';
            backText.textContent = gameState.currentGuess[index] || '';
        });
    },
    showInvalidGuessMessage() {
        // Implementation to show an invalid guess message to the player
        console.error("Invalid guess. Please try a word from the dictionary.");
        // Ideally, this would update the DOM to display the message visibly to the player
    },
    markGuessResult(attempt, guess, result) {
        const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
        if (!currentRow) {
            console.error('Current row not found:', attempt);
            return;
        }

        const tiles = currentRow.querySelectorAll('.tile');

        result.forEach((status, index) => {
            if (!tiles[index]) {
                console.error('Tile not found for index:', index);
                return;
            }

            const tile = tiles[index];
            const back = tile.querySelector('.back');
            const backText = tile.querySelector('.back-text');

            // Setting text for the back
            backText.textContent = guess[index];

            // Adding the status class to back to change its color
            back.classList.add(status);

            // Adding flip animation
            setTimeout(() => {
                tile.classList.add('flipped');
            }, index * 500); // Adding a delay between flips for dramatic effect
        });
    },
    showEndGameMessage(won, word) {
        if (won) {
            console.log('Congratulations! You guessed the word:', word);
        } else {
            console.log('Game over. The word was:', word);
        }
        // This method can be expanded to update the UI with a victory or defeat message
    }
};

export { uiUpdater };
