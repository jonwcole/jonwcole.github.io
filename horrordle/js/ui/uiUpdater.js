import { gameState } from '../state/gameState.js';

const setHintText = (hint) => {
    const hintElement = document.getElementById('hint-text');
    if (hintElement) {
        hintElement.textContent = hint;
    } else {
        console.error("Hint element not found");
    }
};

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
        console.log(gameState);
        const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
        if (!currentRow) {
            console.error('Current row not found:', attempt);
            return;
        }

        const tiles = currentRow.querySelectorAll('.tile');
        const lastFlipTime = (tiles.length - 1) * 500; // Time when the last tile will have flipped

        tiles.forEach((tile, index) => {
            const back = tile.querySelector('.back');
            const backText = tile.querySelector('.back-text');

            // Set the guessed letter and result class
            backText.textContent = guess[index];
            back.classList.add(result[index]);

            // Trigger flip animation with a delay for each tile
            setTimeout(() => tile.classList.add('flipped'), index * 500);
        });

        // Wait for all tiles to flip before updating the onscreen keyboard
        setTimeout(() => {
            result.forEach((status, index) => {
                const letter = guess[index].toUpperCase();
                const keyElement = document.querySelector(`.key[data-key="${letter}"]`);
                if (keyElement && !keyElement.classList.contains('correct')) {
                    keyElement.classList.add(status);
                }
            });

            // After updating the onscreen keyboard, check the game status
            const gameStatus = gameState.getGameStatus();
            if (gameStatus.isGameOver) {
                // Wait a bit longer to show the end game message, ensuring it's after the keyboard update
                setTimeout(() => uiUpdater.showEndGameMessage(gameStatus.won, gameState.wordOfTheDay), 500);
            }
        }, lastFlipTime + 500);
    },

    showHint(hint) {
        // Display the hint container if not already visible
        const hintContainer = document.getElementById('hint');
        if (hintContainer && hintContainer.style.display !== 'block') {
            hintContainer.style.display = 'block';
            hintContainer.style.opacity = '1';
        }
        // Use the utility function to set the hint text
        setHintText(hint);
    },

    showEndGameMessage(won, word, hint) {
        // Disable input and show either the success or failure message
        const messageContainer = won ? document.querySelector('.success') : document.querySelector('.failure');
        const hintContainer = document.getElementById('hint');

        if (messageContainer && hintContainer) {
            // Display the success or failure message
            messageContainer.style.display = 'flex';
            // Display the hint container
            hintContainer.style.display = 'block';

            // After a brief delay, adjust opacity to make them visible. This creates a fade-in effect.
            setTimeout(() => {
                messageContainer.style.opacity = '1';
                hintContainer.style.opacity = '1';
            }, 100);
        }

        // Use the utility function to ensure the hint text is updated
        setHintText(hint);

        // Disable the on-screen keyboard by setting attributes and applying classes
        const keys = document.querySelectorAll('#keyboard .key');
        keys.forEach(key => {
            key.setAttribute('disabled', 'true');
            key.classList.add('disabled'); // Assuming there's a CSS class to visually indicate disabled state
        });
    }
};

export { uiUpdater };
