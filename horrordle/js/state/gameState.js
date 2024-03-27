class GameState {
    constructor() {
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
        // Directly display stats on page load -- REMOVE or MODIFY this line
        const gameGuessLettersFromStorage = localStorage.getItem('gameGuessLetters');
        const gameGuessColorsFromStorage = localStorage.getItem('gameGuessColors');
        this.gameGuessLetters = gameGuessLettersFromStorage ? JSON.parse(gameGuessLettersFromStorage) : [];
        this.gameGuessColors = gameGuessColorsFromStorage ? JSON.parse(gameGuessColorsFromStorage) : [];
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


    loadGameDetails() {
        const gameDate = localStorage.getItem('gameDate');
        const today = new Date().toISOString().slice(0, 10);

        const savedWord = localStorage.getItem('savedWordOfTheDay');
        const savedHint = localStorage.getItem('savedHintOfTheDay');
        const isGameOver = JSON.parse(localStorage.getItem('isGameOver') || 'false');

        // Check if the saved game date matches today's date.
        if (gameDate === today) {
            if (!isGameOver) {
                // There's an unfinished game from today; restore its state.
                this.restoreGameState();
            } else {
                // Today's game is finished. Check if there's a new word and hint for today
                // (could be useful if your game automatically generates a new game after the old one ends).
                // This would be a rare case but might be relevant for games that allow multiple sessions per day.
                if (savedWord && savedHint) {
                    this.startNewGame(savedWord, savedHint, this.dictionary);
                } else {
                    console.error("Today's game is completed, and no new game data is available.");
                }
            }
        } else {
            // No game for today or the saved game is from a different day; start a new game.
            // This assumes savedWord and savedHint are updated daily, even if a game isn't finished.
            if (savedWord && savedHint) {
                this.startNewGame(savedWord, savedHint, this.dictionary);
                // Make sure to reset the game's over status for the new game.
                localStorage.setItem('isGameOver', JSON.stringify(false));
                // Update the game date in localStorage to reflect the new game.
                localStorage.setItem('gameDate', today);
            } else {
                // If no savedWord or savedHint, handle error o use fallback logic.
                console.error("No saved game data available for starting a new game.");
                // Fallback logic here, e.g., show an error message or load default game data.
            }
        }
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

    replaySavedGuesses() {
        this.gameGuessLetters.forEach((guess, index) => {
            const result = this.gameGuessColors[index];
            // This function should exist in your UI handling logic to update the board
            uiUpdater.markGuessResult(index, guess, result, true); // The last parameter indicates this is a restoration
        });

        // Make sure to restore the current attempt number
        this.currentAttempt = this.gameGuessLetters.length;
        // If there were any hints shown, ensure they're displayed again
        if (this.hintDisplayed) {
            uiUpdater.showHint(this.hintOfTheDay);
        }
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
        localStorage.setItem('isGameOver', JSON.stringify(this.isGameOver));


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

        if (gameDate === today && Array.isArray(this.gameGuessLetters) && Array.isArray(this.gameGuessColors)) {
            this.isGameOver = true;
            this.disableInput();

            this.gameGuessLetters.forEach((letters, attemptIndex) => {
                letters.forEach((letter, letterIndex) => {
                    const row = document.querySelector(`.tile-row-wrapper[data-attempt="${attemptIndex}"]`);
                    if (row) {
                        const tiles = row.querySelectorAll('.tile');
                        const tile = tiles[letterIndex];
                        if (tile) {
                            const front = tile.querySelector('.front');
                            const backText = tile.querySelector('.back-text');
                            const splatterBox = tile.querySelector('.splatter-box');

                            front.textContent = letter;
                            backText.textContent = letter;
                            backText.parentElement.className = 'back ' + this.gameGuessColors[attemptIndex][letterIndex];

                            // Apply splatter effect for lost games
                            if (splatterBox && localStorage.getItem('gameOutcome') === 'lost') {
                                splatterBox.style.display = 'block';
                                splatterBox.style.opacity = '1';
                            }

                            setTimeout(() => tile.classList.add('flipped'), letterIndex * 150);
                        }
                    }
                });
            });

            // Safely update the Word of the Day and Hint of the Day
            const wordElement = document.getElementById('word-content');
            if (wordElement) {
                wordElement.textContent = this.wordOfTheDay;
            } else {
                console.error('#word-content element not found');
            }

            const hintElement = document.getElementById('hint-text');
            if (hintElement) {
                hintElement.textContent = this.hintOfTheDay;
            } else {
                console.error('#hint-text element not found');
            }

            // Display the failure or word reveal and hint elements
            const wordContainer = document.getElementById('word-reveal');
            if (wordContainer) {
                wordContainer.style.display = 'flex';
                setTimeout(() => {
                    wordContainer.style.opacity = '1';
                }, 100);
            }

            const hintContainer = document.getElementById('hint');
            if (hintContainer) {
                hintContainer.style.display = 'block';
                setTimeout(() => {
                    hintContainer.style.opacity = '1';
                }, 100);
            }
            // Display the completed message
            const completedMessage = document.getElementById('completed-message');
            if (completedMessage) {
                completedMessage.style.display = 'flex';
            }
        } else {
            // Reset or start new game logic...
        }
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

