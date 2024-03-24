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
        // You might update the DOM to display this message visibly to the player
    },
    markGuessResult(guess, result) {
        // Update the tiles to show correct/present/absent
        console.log(`Guess result: ${guess} - ${result}`);
    },
    showEndGameMessage(won, word) {
        if (won) {
            console.log('Congratulations! You guessed the word:', word);
        } else {
            console.log('Game over. The word was:', word);
        }
    }
};

export const uiUpdater = {
    markGuessResult(attempt, guess, result) {
        // Implementation to visually mark the guess result on the UI
    },
    showInvalidGuessMessage() {
        // Implementation to show a message for invalid/short guesses
    },
    // Other UI-related methods...
};
