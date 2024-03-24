// Assuming gameState.js and uiUpdater.js are in 'state' and 'ui' subdirectories, respectively
import { gameState } from '../state/gameState.js';
import { uiUpdater } from '../ui/uiUpdater.js';

// Correctly handle key presses, including 'ENTER' and 'BACKSPACE'
export function handleKeyPress(key) {
    // Check if the game is over before handling any key presses
    if (gameState.isGameOver) {
        console.log("Game is over. No input accepted.");
        return; // Exit the function early if the game is over
    }

    if (key === 'ENTER') {
        handleSubmit();
    } else if (key === 'BACKSPACE') {
        gameState.removeLastLetter();
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join(''));
    } else if (/^[A-Z]$/i.test(key)) {
        gameState.updateCurrentGuess(key.toUpperCase());
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join(''));
    }
}

// Submit the current guess
function handleSubmit() {
    const currentGuess = gameState.currentGuess.join('');

    if (currentGuess.length === 5) {
        // Check if the guess is a valid dictionary word
        if (!gameState.isValidGuess(currentGuess)) {
            // If not valid, shake the current row and show an error message
            showInvalidGuessAnimation();
            uiUpdater.showInvalidGuessMessage(); // Show a message indicating the guess is invalid
        } else {
            // If valid, proceed to submit the guess
            gameState.submitGuess(currentGuess, uiUpdater); // Pass uiUpdater to handle UI updates
        }
    } else {
        console.error("Guess too short.");
        uiUpdater.showInvalidGuessMessage("Guess too short."); // Optionally, customize the message for short guesses
    }
}

function showInvalidGuessAnimation() {
    const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${gameState.currentAttempt}"]`);
    if (currentRow) {
        currentRow.classList.add('shake');
        // Remove the class after the animation ends to allow re-application in future
        setTimeout(() => currentRow.classList.remove('shake'), 820); // Match the duration of the animation
    }
}


// Listen for keyboard events
document.addEventListener('keydown', (event) => {
    if (!gameState.isInputEnabled()) return; // Ignore input if disabled
    // Check for modifier keys
    if (event.ctrlKey || event.altKey || event.metaKey) {
        // Ignore the key press if any modifier key is pressed
        return;
    }

    if (event.key === 'Enter') {
        handleSubmit();
    } else if (event.key === 'Backspace') {
        event.preventDefault(); // Prevent default backspace action
        gameState.removeLastLetter();
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join(''));
    } else {
        const key = event.key.toUpperCase();
        // Only accept single letter inputs without any modifier keys
        if (/^[A-Z]$/i.test(key)) {
            handleKeyPress(key);
        }
    }
});
