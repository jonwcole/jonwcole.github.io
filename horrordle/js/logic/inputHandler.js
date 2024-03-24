// Assuming gameState.js and uiUpdater.js are in 'state' and 'ui' subdirectories, respectively
import { gameState } from '../state/gameState.js';
import { uiUpdater } from '../ui/uiUpdater.js';

function handleKeyPress(key) {
    if (key === 'ENTER') {
        handleSubmit();
    } else if (key === 'BACKSPACE') {
        gameState.removeLastLetter();
        uiUpdater.updateGuessDisplay();
    } else if (/^[A-Z]$/i.test(key)) {
        gameState.updateCurrentGuess(key.toUpperCase());
        uiUpdater.updateGuessDisplay();
    }
}

function handleSubmit() {
    const currentGuess = gameState.currentGuess.join('');
    if (currentGuess.length === 5) {
        gameState.submitGuess(currentGuess, uiUpdater); // Pass uiUpdater here
    } else {
        console.error("Guess too short.");
        // Optionally, invoke uiUpdater to show an error message
        uiUpdater.showInvalidGuessMessage(); // Ensure this method exists in uiUpdater
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleSubmit();
    } else if (event.key === 'Backspace') {
        event.preventDefault(); // Prevent default backspace action
        gameState.removeLastLetter();
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join(''));
    } else {
        const key = event.key.toUpperCase();
        if (/^[A-Z]$/i.test(key)) {
            handleKeyPress(key);
        }
    }
});

export function handleKeyPress(key) {
    // Function implementation...
}