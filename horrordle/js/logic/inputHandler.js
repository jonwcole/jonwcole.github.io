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
    const currentGuess = gameState.currentGuess.join('');
    if (currentGuess.length === 5) { // Assuming a 5-letter word game
        gameState.submitGuess(currentGuess);
        gameState.compareGuess(currentGuess, uiUpdater); // Updates the game state with the guess
        uiUpdater.updateGuessDisplay('');
        compareGuess(currentGuess); // Function to compare guess with the word of the day
    } else {
        console.error("Guess too short.");
        // Optionally, provide user feedback for an invalid guess
        uiUpdater.showInvalidGuessMessage(); // This would be a new UI function
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
