import { gameState } from '../state/gameState.js';

const uiUpdater = {

    updateGuessDisplay() {
        // Utilizes gameState to access the currentAttempt and currentGuess
        const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${gameState.currentAttempt}"]`);
        
        if (!currentRow) {
            console.error('Current row not found:', gameState.currentAttempt);
            return;
        }

        const tiles = currentRow.querySelectorAll('.tile');

        // Clear existing letters in the current row's tiles before setting new ones
        tiles.forEach((tile, index) => {
            const front = tile.querySelector('.front');
            const backText = tile.querySelector('.back-text');
            // Reset content for both front and back-text
            front.textContent = gameState.currentGuess[index] || '';
            backText.textContent = gameState.currentGuess[index] || '';
        });
    },
    showInvalidGuessMessage() {
        // Implementation to show an invalid guess message to the player
        console.error("Invalid guess. Please try a word from the dictionary.");
        // Ideally, this would update the DOM to display the message visibly to the player
    },
    markGuessResult(attempt, guess, result) {
        console.log(gameState);
        const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
        if (!currentRow) {
            console.error('Current row not found:', attempt);
            return;
        }

        const tiles = currentRow.querySelectorAll('.tile');
        const lastFlipTime = (tiles.length - 1) * 500; // Time when the last tile will have flipped

        tiles.forEach((tile, index) => {
            const back = tile.querySelector('.back');
            const backText = tile.querySelector('.back-text');

            // Set the guessed letter and result class
            backText.textContent = guess[index];
            back.classList.add(result[index]);

            // Trigger flip animation with a delay for each tile
            setTimeout(() => tile.classList.add('flipped'), index * 500);
        });

        // Wait for all tiles to flip before updating the onscreen keyboard
        setTimeout(() => {
            result.forEach((status, index) => {
                const letter = guess[index].toUpperCase();
                const keyElement = document.querySelector(`.key[data-key="${letter}"]`);
                if (keyElement && !keyElement.classList.contains('correct')) {
                    keyElement.classList.add(status);
                }
            });

            // After updating the onscreen keyboard, check the game status
            const gameStatus = gameState.getGameStatus();
            if (gameStatus.isGameOver) {
                // Wait a bit longer to show the end game message, ensuring it's after the keyboard update
                setTimeout(() => uiUpdater.showEndGameMessage(gameStatus.won, gameState.wordOfTheDay), 500);
            }
        }, lastFlipTime + 500);
    },
    showHint(hint) {
        const hintElement = document.getElementById('hint-text');
        const hintContainer = hintElement.closest('#hint');

        if (hintElement && hintContainer) {
            // Calculate total flip animation time
            // Assuming 5 tiles and 500ms delay per tile flip
            const totalFlipTime = 5 * 500;

            setTimeout(() => {
                hintElement.textContent = hint; // Update the hint text
                hintContainer.style.display = 'block'; // Make sure the container is visible
                
                // Delay the opacity change slightly to ensure the transition is visible
                setTimeout(() => {
                    hintContainer.style.opacity = '1'; // Fade in the hint container
                }, 10); // 10ms delay before starting the opacity transition
            }, totalFlipTime); // Delay showing the hint until after the tiles have flipped
        } else {
            console.error("Hint element or container not found");
        }
    },
    showEndGameMessage(won, word, hint) {
        const messageContainer = won ? document.querySelector('.success') : document.querySelector('.failure');
        const hintContainer = document.getElementById('hint');
        const hintElement = document.getElementById('hint-text');
        const wordElement = document.getElementById('word-content');
        const splatterBoxes = document.querySelectorAll('.splatter-box'); // Select all splatter-box divs

        if (messageContainer && hintElement && hintContainer && wordElement) {
            messageContainer.style.display = 'flex';
            hintContainer.style.display = 'block';

            setTimeout(() => {
                messageContainer.style.opacity = '1';
                hintContainer.style.opacity = '1';
                if (!won) { // Only show the splatter effect if the user loses
                    splatterBoxes.forEach(box => {
                        box.style.display = 'block';
                        setTimeout(() => box.style.opacity = '1', 100); // Use a timeout to allow for CSS transitions
                    });
                }
            }, 100);

            wordElement.textContent = word;
            if (hint && hintElement.textContent !== hint) {
                hintElement.textContent = hint;
            }
        }

        const keys = document.querySelectorAll('#keyboard .key');
        keys.forEach(key => {
            key.setAttribute('disabled', 'true');
            key.classList.add('disabled');
        });
    },
    updateStatsDisplay(stats) {
        // Make sure to check for null to avoid errors
        const gamesPlayedElement = document.getElementById('games-played');
        const winPercentageElement = document.getElementById('win-percentage');
        const currentStreakElement = document.getElementById('current-streak');
        const maxStreakElement = document.getElementById('max-streak');
        const distributionElements = [1, 2, 3, 4, 5, 6].map(number => 
            document.getElementById(`distribution-${number}`));

        if (gamesPlayedElement) gamesPlayedElement.textContent = stats.gamesPlayed || 0;
        const winPercentage = stats.winPercentage !== undefined ? stats.winPercentage 
                          : stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) 
                          : 0;

        if (winPercentageElement) winPercentageElement.textContent = `${winPercentage}%`;
        if (currentStreakElement) currentStreakElement.textContent = stats.currentStreak;
        if (maxStreakElement) maxStreakElement.textContent = stats.maxStreak;

        // Update guess distribution bars
        distributionElements.forEach((element, index) => {
            if (element && element.firstChild) { // Check if element and its first child exist
                element.firstChild.textContent = stats.guessDistribution[index + 1];
                // Optionally, adjust the width of the bar based on the distribution value
            }
        });
    },
    updateGuessDistribution(stats) {
        const totalWins = Object.values(stats.guessDistribution).reduce((total, num) => total + num, 0);
        Object.entries(stats.guessDistribution).forEach(([guessNumber, count]) => {
            const percentage = totalWins > 0 ? (count / totalWins) * 100 : 0;
            const barElement = document.getElementById(`distribution-${guessNumber}`);
            if (barElement) {
                barElement.style.width = `${percentage}%`;
                barElement.textContent = count; // Update the text to show the count
            }
        });
    },

};

export { uiUpdater };
