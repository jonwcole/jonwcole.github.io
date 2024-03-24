// Assuming gameState.js and uiUpdater.js are in 'state' and 'ui' subdirectories, respectively
import { gameState } from '../state/gameState.js';
import { uiUpdater } from '../ui/uiUpdater.js';

function handleKeyPress(key) {
    console.log(`Key pressed: ${key}`);
    if (key.length === 1 && /^[A-Z]$/i.test(key)) { // Ensures a single, valid letter
        gameState.updateCurrentGuess(key.toUpperCase());
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join(''));
    }
    // Implement other key handling (Enter, Backspace) here
}

function handleSubmit() {
    const currentGuess = gameState.currentGuess.join('').toUpperCase();
    if (!gameState.isValidGuess(currentGuess)) {
        // Inform the player the guess is not a valid word
        uiUpdater.showInvalidGuessMessage(currentGuess);
        return;
    } else {
        console.error("Guess too short.");
        // Optional: Provide feedback to the user through UI
    }

    // Proceed to compare the guess with the Word of the Day
    gameState.submitGuess(currentGuess);
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
