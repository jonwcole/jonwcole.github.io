function handleKeyPress(key) {
    // Example: Add key to current guess or handle special keys (Enter, Backspace)
    console.log(`Key pressed: ${key}`);
    // Update game state and UI here
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        // Submit guess
    } else if (event.key === 'Backspace') {
        // Remove last character from current guess
    } else {
        const key = event.key.toUpperCase();
        if (/^[A-Z]$/i.test(key)) {
            handleKeyPress(key);
        }
    }
});
