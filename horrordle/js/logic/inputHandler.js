// Assuming gameState.js and uiUpdater.js are in 'state' and 'ui' subdirectories, respectively
import { gameState } from '../state/gameState.js';
import { uiUpdater } from '../ui/uiUpdater.js';

// Correctly handle key presses, including 'ENTER' and 'BACKSPACE'
export function handleKeyPress(key) {
    if (key === 'ENTER') {
        handleSubmit();
    } else if (key === 'BACKSPACE') {
        gameState.removeLastLetter();
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join('')); // Ensure gameState.currentGuess is properly updated
    } else if (/^[A-Z]$/i.test(key)) {
        gameState.updateCurrentGuess(key.toUpperCase());
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join('')); // Update display with the new guess
    }
}

// Submit the current guess
function handleSubmit() {
    const currentGuess = gameState.currentGuess.join('');
    if (currentGuess.length === 5) {
        gameState.submitGuess(currentGuess, uiUpdater); // Pass uiUpdater here
    } else {
        console.error("Guess too short.");
        uiUpdater.showInvalidGuessMessage(); // Ensure this method exists in uiUpdater
    }
}

// Listen for keyboard events
document.addEventListener('keydown', (event) => {
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
