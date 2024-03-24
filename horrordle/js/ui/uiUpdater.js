function updateCurrentGuessDisplay(currentGuess) {
    // Update the DOM elements representing the current guess
    console.log(`Update display with current guess: ${currentGuess}`);
}

function markGuessResult(guess, result) {
    // Update the tiles to show correct/present/absent
    console.log(`Guess result: ${guess} - ${result}`);
}

function showEndGameMessage(won, word) {
    if (won) {
        console.log('Congratulations! You guessed the word:', word);
    } else {
        console.log('Game over. The word was:', word);
    }
    // Update the UI with the end game message
}
