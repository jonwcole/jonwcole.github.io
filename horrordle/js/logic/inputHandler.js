function handleKeyPress(key) {
    console.log(`Key pressed: ${key}`);
    if (key.length === 1 && /^[A-Z]$/i.test(key)) { // Ensures a single, valid letter
        gameState.updateCurrentGuess(key.toUpperCase());
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join(''));
    }
    // Implement other key handling (Enter, Backspace) here
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        // Submit guess
    } else if (event.key === 'Backspace') {
        gameState.removeLastLetter();
        uiUpdater.updateGuessDisplay(gameState.currentGuess.join(''));
    } else {
        const key = event.key.toUpperCase();
        if (/^[A-Z]$/i.test(key)) {
            handleKeyPress(key);
        }
    }
});

function handleSubmit() {
    const currentGuess = gameState.currentGuess.join('');
    // Validate guess length, dictionary membership, etc., before proceeding
    if (currentGuess.length === 5) {
        // Process guess (compare with word of the day, update game state, etc.)
        gameState.submitGuess(currentGuess);
        // Reset current guess display in UI
        uiUpdater.updateGuessDisplay('');
        // Update game board to reflect guess results
    } else {
        // Handle error (e.g., guess too short)
    }
}

// Add to your 'keydown' event listener
if (event.key === 'Enter') {
    handleSubmit();
}
