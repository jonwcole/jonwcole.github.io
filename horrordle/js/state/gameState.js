class GameState {
    constructor() {
        // Initialize gameGuessLetters and gameGuessColors as empty arrays
        this.gameGuessLetters = JSON.parse(localStorage.getItem('gameGuessLetters')) || [];
        this.gameGuessColors = JSON.parse(localStorage.getItem('gameGuessColors')) || [];
        
        // Initialize other properties
        this.dictionary = [];
        this.reset();
        this.incorrectGuessCount = 0;
        this.inputEnabled = true;
        this.uiUpdater = null;
        
        // Initialize stats
        this.stats = {
            gamesPlayed: 0,
            wins: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
            lastPlayedDate: '',
        };

        this.loadStats();
        this.loadGameDetails();
    }

    init(uiUpdater) {
        this.uiUpdater = uiUpdater; // Store uiUpdater reference
        // Safe to use uiUpdater here
        this.uiUpdater.updateStatsDisplay(this.stats);
    }

    reset() {
        this.currentAttempt = 0;
        this.maxAttempts = 6;
        this.isGameOver = false;
        localStorage.setItem('isGameOver', JSON.stringify(this.isGameOver));
        this.wordOfTheDay = '';
        this.hintOfTheDay = '';
        this.guesses = [];
        this.currentGuess = [];
    }

    updateUI() {
        if (this.uiUpdater) {
            this.uiUpdater.updateStatsDisplay(this.stats);
            // Add any other UI update calls you need here
        } else {
            console.error("UI Updater not initialized.");
        }
    }

    setUiUpdater(updater) {
        this.uiUpdater = updater;
    }

    loadGameDetails(dailyWord, dailyHint, dictionary) {
        const gameDate = localStorage.getItem('gameDate');
        const today = new Date().toISOString().slice(0, 10);
        const savedWord = localStorage.getItem('savedWordOfTheDay');
        const savedHint = localStorage.getItem('savedHintOfTheDay');
        this.isGameOver = JSON.parse(localStorage.getItem('isGameOver') || 'false');

        // Scenario #1: Continue an unfinished game from today
        if (gameDate === today && !this.isGameOver && this.gameGuessLetters.length > 0) {
            console.log("Restoring an unfinished game.");
            this.restoreGameState(); // This assumes restoreGameState method is already correctly implemented
        }
        // Scenario #2: Starting or restoring a game for today with savedWord and savedHint
        else if (gameDate === today && (savedWord && savedHint)) {
            console.log("Starting/restoring today's game with saved daily word and hint.");
            this.startNewGame(savedWord, savedHint, this.dictionary);
            this.restoreGameState();
        }
        // Scenario #3: Start a new game for today
        else if (!gameDate || gameDate !== today) {
            console.log("Starting a new game for today.");
            this.startNewGame(dailyWord, dailyHint, dictionary);
            // Save the new game details
            localStorage.setItem('gameDate', today);
            localStorage.setItem('savedWordOfTheDay', dailyWord);
            localStorage.setItem('savedHintOfTheDay', dailyHint);
            localStorage.setItem('isGameOver', 'false');
            localStorage.removeItem('gameGuessLetters');
            localStorage.removeItem('gameGuessColors');
            this.reset(); // Ensure the game state is reset for a new game
        }
        // Add any additional scenarios as needed
    }

    startNewGame(wordOfTheDay, hintOfTheDay, dictionary) {
        this.reset();
        if (!wordOfTheDay || !hintOfTheDay) {
            console.error("Cannot start game without word of the day or hint.");
            // Add fallback logic here, e.g., set default values or handle error
            return;
        }

        // Game initialization logic continues as normal...
    }

    startNewGame(wordOfTheDay, hintOfTheDay, dictionary) {
        this.reset(); // Reset the game state for a new game
        this.wordOfTheDay = wordOfTheDay.toUpperCase();
        this.hintOfTheDay = hintOfTheDay;
        this.dictionary = dictionary; // Assuming the dictionary is passed here or loaded before calling this method
    }

    removeLastLetter() {
        this.currentGuess.pop();
    }

    submitGuess(guess, uiUpdater) {
        // Validate the guess
        if (!this.isValidGuess(guess)) {
            uiUpdater.showInvalidGuessMessage();
            uiUpdater.shakeCurrentRow(this.currentAttempt);
            return;
        }

        // Save the guess letters
        this.gameGuessLetters.push([...guess]); // Spread the guess into an array of its characters

        guess = guess.toUpperCase();
        this.guesses.push(guess);
        const result = this.compareGuess(guess);
        this.gameGuessColors.push(result);

        localStorage.setItem('gameGuessLetters', JSON.stringify(this.gameGuessLetters));
        localStorage.setItem('gameGuessColors', JSON.stringify(this.gameGuessColors));


        // Increment attempt count
        this.currentAttempt++;

        // Check if the guess is incorrect
        if (guess !== this.wordOfTheDay) {
            this.incorrectGuessCount++;
        }

        // Update UI with the guess result
        uiUpdater.markGuessResult(this.currentAttempt - 1, guess, result); // Adjust to currentAttempt - 1 if needed

        // Reveal hint after 5 incorrect guesses
        if (this.incorrectGuessCount >= 5 && !this.hintDisplayed) {
            uiUpdater.showHint(this.hintOfTheDay);
            this.hintDisplayed = true;
        }

        // Game over logic
        if (guess === this.wordOfTheDay || this.currentAttempt >= this.maxAttempts) {
            this.endGame(guess === this.wordOfTheDay, uiUpdater);
        } else {
            // Prepare for the next guess
            this.currentGuess = [];
        }
    }

    // Assuming you have an endGame method in your GameState class
    endGame(won, uiUpdater) {
        // Set game over state
        this.isGameOver = true;
        localStorage.setItem('isGameOver', JSON.stringify(this.isGameOver));
        this.updateStats(won);

        // Depending on the outcome, show the end game message
        setTimeout(() => {
            uiUpdater.showEndGameMessage(won, this.wordOfTheDay, this.hintOfTheDay);
        }, 2500); // Use a delay to allow for any animations or transitions

        // Disable further input if necessary
        this.disableInput();
    }

    compareGuess(guess) {
        const result = guess.split('').map((letter, index) => {
            if (letter === this.wordOfTheDay[index]) {
                return 'correct';
            } else if (this.wordOfTheDay.includes(letter)) {
                return 'present';
            } else {
                return 'absent';
            }
        });

        return result;
    }

    isValidGuess(guess) {
        // Check if dictionary is defined and is an array
        if (!Array.isArray(this.dictionary)) {
            console.error("Dictionary is not loaded or not an array.");
            return false; // Or handle this scenario as needed
        }
        return this.dictionary.includes(guess.toUpperCase());
    }

    isCorrectGuess(guess) {
        return guess.toUpperCase() === this.wordOfTheDay;
    }

    getRemainingAttempts() {
        return this.maxAttempts - this.currentAttempt;
    }

    getGameStatus() {
        const lastGuess = this.guesses[this.guesses.length - 1];
        return {
            isGameOver: this.isGameOver,
            won: lastGuess ? this.isCorrectGuess(lastGuess) : false,
            remainingAttempts: this.getRemainingAttempts(),
        };
    }

    updateCurrentGuess(letter) {
        // Ensure the current guess doesn't exceed the maximum length (e.g., 5 for Wordle)
        if (this.currentGuess.length < 5) {
            this.currentGuess.push(letter);
        }
    }

    isInputEnabled() {
        return this.inputEnabled;
    }

    prepareNextAttempt() {
        // Logic to prepare for the next guess attempt
        // For example, this could reset the currentGuess array for a new guess:
        this.currentGuess = [];
        
        // And potentially other preparation logic...
    }

restoreGameState() {
    const gameDate = localStorage.getItem('gameDate');
    const today = new Date().toISOString().slice(0, 10);
    // Use a more reliable way to determine if the game was finished.
    this.isGameOver = JSON.parse(localStorage.getItem('isGameOver') || 'false');
    
    // Only disable input if the game was actually finished.
    if (this.isGameOver) {
        this.disableInput();
    }

    if (gameDate === today && this.gameGuessLetters.length) {
        // Restore guesses on the board
        this.replaySavedGuesses();
        
        // Additional UI updates based on game state
        if (!this.isGameOver) {
            // The game is not over; ensure UI is interactive and reflects the current state.
        } else {
            // The game was finished; update UI accordingly.
            // For example, show word, hint, and any completion messages.
            // Note: Adjust these based on your actual UI structure and IDs.
            this.updateUIForFinishedGame(); // You might need to create this method.
        }
    } else {
        // This branch could be for handling scenarios where there's no game to restore.
        // E.g., start a new game or show a welcome screen.
    }
}

replaySavedGuesses() {
    this.gameGuessLetters.forEach((letters, attemptIndex) => {
        letters.forEach((letter, letterIndex) => {
            // Replay each guess on the board. This might involve flipping tiles, setting colors, etc.
            // Similar to what you already have, but ensure it's adjusted to only replay, not assume game over.
        });
    });
    // Ensure the current attempt is correctly set based on restored guesses
    this.currentAttempt = this.gameGuessLetters.length;
}


    replayGuess(guessLetters, resultColors, attemptIndex) {
        const rowSelector = `.tile-row-wrapper[data-attempt="${attemptIndex}"]`;
        const rowElement = document.querySelector(rowSelector);
        if (!rowElement) {
            console.error(`Row for attempt ${attemptIndex} not found.`);
            return;
        }

        const tiles = rowElement.querySelectorAll('.tile');
        guessLetters.forEach((letter, tileIndex) => {
            const tile = tiles[tileIndex];
            if (!tile) {
                console.error(`Tile ${tileIndex} in row ${attemptIndex} not found.`);
                return;
            }

            const front = tile.querySelector('.front');
            const back = tile.querySelector('.back');
            front.textContent = letter;
            back.textContent = letter;
            tile.classList.add('flipped'); // Flip the tile
            back.className = `back ${resultColors[tileIndex]}`; // Apply the result class
        });
    }

    endGame(won, uiUpdater) {

        // Update game outcome
        const gameOutcome = won ? "won" : "lost";
        localStorage.setItem('gameOutcome', gameOutcome);

        // Save the game date
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('gameDate', today);

        // Update stats and save them
        this.updateStats(won, this.guesses.length);

        // Save updated stats to localStorage immediately after updating
        this.saveStats();

        this.isGameOver = true;

        // Disable further input as game is over
        this.disableInput();

        // Use a delay to allow for animations or other UI updates before showing the end game message
        setTimeout(() => {
            uiUpdater.showEndGameMessage(won, this.wordOfTheDay, this.hintOfTheDay);
            // Refresh stats UI
            uiUpdater.updateStatsDisplay(this.stats);
        }, 2500);
    }

    showEndGameBasedOnOutcome(won) {
        const endGameMessage = won ? "Congratulations! You've won." : "Game over. Better luck next time!";
        // Display the end game message in the UI
        uiUpdater.showEndGameMessage(won, this.wordOfTheDay, this.hintOfTheDay, endGameMessage);

        // Optionally, handle any other UI adjustments needed for a completed game
    }

    updateStats(won, guessCount) {
        const today = new Date().toISOString().slice(0, 10);
        this.stats.gamesPlayed++;
        this.stats.lastPlayedDate = today;

        if (won) {
            this.stats.wins++;
            this.stats.lastWinGuesses = guessCount;
            this.stats.lastGameWon = true;
            this.stats.guessDistribution[guessCount] = (this.stats.guessDistribution[guessCount] || 0) + 1;
            // Update streaks
            this.stats.currentStreak = (this.stats.lastPlayedDate === today) ? this.stats.currentStreak + 1 : 1;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
        } else {
            this.stats.lastGameWon = false;
            this.stats.currentStreak = 0;
        }

        this.saveStats();
    }

    loadStats() {
        const statsFromStorage = localStorage.getItem('stats');
        if (statsFromStorage) {
          this.stats = JSON.parse(statsFromStorage);
          console.log("Loaded stats:", this.stats); // Verify the loaded stats
        }
    }

    saveStats() {
        localStorage.setItem('stats', JSON.stringify(this.stats));
    }

    disableInput() {
        this.inputEnabled = false;
        // Assuming your keys have a common class name 'key'
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.setAttribute('disabled', true); // Disables the button
            key.classList.add('disabled'); // Optionally add a 'disabled' class for styling
        });
    }

}

// Export the GameState class for use in other modules
export const gameState = new GameState();
gameState.setUiUpdater(uiUpdater);

gameState.init(uiUpdater); // Assuming this method exists and sets up uiUpdater
gameState.loadGameDetails(dataManager.dailyWord, dataManager.hint, dataManager.dictionary);

export function generateResultString() {
    const storedGuesses = JSON.parse(localStorage.getItem('gameGuessColors') || '[]');
    const emojiMap = {
        'absent': '⬛',
        'present': '🟨',
        'correct': '🟥'
    };

    const resultString = storedGuesses.map(guess =>
        guess.map(status => emojiMap[status]).join('')
    ).join('\n');

    const date = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    return `Horrordle.app, ${date}\n\n${resultString}`;
}

