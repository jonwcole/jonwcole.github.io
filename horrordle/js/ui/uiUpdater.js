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

        // Assume all tiles will flip; calculate when the last tile flips
        const lastFlipTime = (tiles.length - 1) * 500; // Based on your delay calculation

        tiles.forEach((tile, index) => {
            const back = tile.querySelector('.back');
            const backText = tile.querySelector('.back-text');

            // Set the guessed letter and apply the result class
            backText.textContent = guess[index];
            back.classList.add(result[index]);

            // Trigger the flip animation
            setTimeout(() => {
                tile.classList.add('flipped');
            }, index * 500);
        });

        // Update the onscreen keyboard after the last tile has flipped
        setTimeout(() => {
            result.forEach((status, index) => {
                const letter = guess[index];
                const keyElement = document.querySelector(`.key[data-key="${letter.toUpperCase()}"]`);
                if (keyElement && !keyElement.classList.contains('correct')) {
                    keyElement.classList.add(status);
                }
            });
        }, lastFlipTime + 500); // Adding 500 to ensure it's after the last tile flips
    },
    showHint(hint) {
        console.log("Displaying hint again:", hint); // Confirm what hint is at this moment
        const hintElement = document.getElementById('hint-text');
        if (hintElement) {
            hintElement.textContent = hint; // Update the hint text
            // Optionally, if the hint container itself is hidden, reveal it:
            const hintContainer = hintElement.closest('#hint');
            if (hintContainer) {
                hintContainer.style.display = 'block'; // Make sure the container is visible
                hintContainer.style.opacity = '1';
            }
        } else {
            console.error("Hint element not found");
        }
    },
    showEndGameMessage(won, word) {
        gameState.disableInput(); // Disable further input
        const messageContainer = won ? document.querySelector('.success') : document.querySelector('.failure');

        if (messageContainer) {
            messageContainer.style.display = 'flex';
            hintContainer.style.display = 'block';
            setTimeout(() => {
                messageContainer.style.opacity = '1';
                hintContainer.style.opacity = '1';
            }, 100); // Small delay to ensure transition can occur
        }

        // Optionally, disable on-screen keyboard here
        const keys = document.querySelectorAll('#keyboard .key');
        keys.forEach(key => {
            key.setAttribute('disabled', 'true');
            key.classList.add('disabled'); // Assuming you have a CSS class to visually indicate disabled state
        });
    }
};

export { uiUpdater };

