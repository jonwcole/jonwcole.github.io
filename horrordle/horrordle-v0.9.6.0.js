// v0.9.5.3 //

// ================================== //
// 1. Initialization and Data Loading //
// ================================== //

let dictionary = [];
let wordOfTheDayNormalized = '';

// Cache DOM elements
const gameElements = {
    elements: {
        // Game board
        gameBoard: document.getElementById('game-board'),
        tileRows: document.querySelectorAll('.tile-row-wrapper'),
        tiles: document.querySelectorAll('.tile'),
        
        // Keyboard
        keyboard: document.getElementById('keyboard'),
        keyboardKeys: document.querySelectorAll('.key'),
        
        // Messages and UI
        hint: document.getElementById('hint'),
        hintText: document.getElementById('hint-text'),
        errorMessage: document.getElementById('error-message'),
        wordReveal: document.getElementById('word-reveal'),
        wordContent: document.getElementById('word-content'),
        context: document.getElementById('context'),
        contextText: document.getElementById('context-text'),
        instructions: document.querySelector('.instructions'),
        instructionsDismiss: document.querySelector('.instructions-dismiss'),
        
        // Stats
        statsOverlay: document.getElementById('stats-overlay'),
        gamesPlayed: document.getElementById('games-played'),
        winPercentage: document.getElementById('win-percentage'),
        currentStreak: document.getElementById('current-streak'),
        maxStreak: document.getElementById('max-streak'),
        resultText: document.getElementById('result-text'),
        distributionBars: {
            1: document.getElementById('distribution-1'),
            2: document.getElementById('distribution-2'),
            3: document.getElementById('distribution-3'),
            4: document.getElementById('distribution-4'),
            5: document.getElementById('distribution-5'),
            6: document.getElementById('distribution-6')
        },
        
        // Navigation
        navButton: document.querySelector('.nav-button-default-state'),
        navButtonClose: document.querySelector('.nav-button-close-target'),
        
        // Splatter effects
        splatterBoxes: document.querySelectorAll('.splatter-box'),
        shareButton: document.getElementById('share-result'),
        copyConfirmation: document.getElementById('copy-confirmation'),
        completedMessage: document.querySelector('.completed-message'),
    },

    init() {
        this.validateElements();
        this.setupEventListeners();
        this.setupShare();
    },

    validateElements() {
        // Validate all elements exist
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element && !['distributionBars', 'splatterBoxes'].includes(key)) {
                console.warn(`Missing element: ${key}`);
            }
        }
        
        // Validate distribution bars
        for (const [key, element] of Object.entries(this.elements.distributionBars)) {
            if (!element) {
                console.warn(`Missing distribution bar: ${key}`);
            }
        }
    },

    setupEventListeners() {
        // Keyboard events
        if (this.elements.keyboard) {
            this.elements.keyboard.addEventListener('click', (e) => {
                if (e.target.matches('.key')) {
                    const key = e.target.getAttribute('data-key');
                    this.handleKeyboardInput(key);
                }
            });
        }

        // Instructions dismiss
        if (this.elements.instructionsDismiss) {
            this.elements.instructionsDismiss.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('hasVisited', 'true');
                if (this.elements.instructions) {
                    this.elements.instructions.style.display = 'none';
                }
            });
        }

        // Add share button setup
        this.setupShareButton();
    },

    // UI Update Methods
    updateTile(rowIndex, tileIndex, letter, status) {
        const row = this.elements.tileRows[rowIndex];
        if (row) {
            const tile = row.querySelectorAll('.tile')[tileIndex];
            if (tile) {
                const front = tile.querySelector('.front');
                const back = tile.querySelector('.back');
                if (front && back) {
                    front.textContent = letter;
                    back.className = `back ${status || ''}`;
                }
            }
        }
    },

    showError(message, duration = 2000) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.style.display = 'block';
            this.elements.errorMessage.style.opacity = '1';
            
            setTimeout(() => {
                this.elements.errorMessage.style.opacity = '0';
                setTimeout(() => {
                    this.elements.errorMessage.style.display = 'none';
                }, 300);
            }, duration);
        }
    },

    updateStats(stats) {
        const elements = this.elements;
        if (elements.gamesPlayed) {
            elements.gamesPlayed.textContent = stats.gamesPlayed;
        }
        if (elements.winPercentage) {
            elements.winPercentage.textContent = `${stats.winPercentage}%`;
        }
        if (elements.currentStreak) {
            elements.currentStreak.textContent = stats.currentStreak;
        }
        if (elements.maxStreak) {
            elements.maxStreak.textContent = stats.maxStreak;
        }
    },

    displayHint() {
        const elements = this.elements;
        if (elements.hint && elements.hintText && !hintDisplayed) {
            elements.hint.style.display = 'block';
            elements.hintText.textContent = hintOfTheDay;
            void elements.hint.offsetWidth; // Force reflow
            elements.hint.style.opacity = '1';
            hintDisplayed = true;
        }
    },

    revealWord() {
        const elements = this.elements;
        if (elements.wordReveal && elements.wordContent) {
            elements.wordContent.textContent = wordOfTheDay;
            elements.wordReveal.style.display = 'flex';
            setTimeout(() => {
                elements.wordReveal.style.opacity = '1';
            }, 100);
        }
    },

    showSplatterEffects() {
        if (this.elements.splatterBoxes) {
            this.elements.splatterBoxes.forEach(box => {
                box.style.display = 'block';
                setTimeout(() => box.style.opacity = '1', 10);
            });
        }
    },

    toggleKeyboard(enable) {
        if (this.elements.keyboard) {
            this.elements.keyboard.style.pointerEvents = enable ? 'auto' : 'none';
            this.elements.keyboardKeys.forEach(key => {
                if (enable) {
                    key.removeAttribute('disabled');
                    key.classList.remove('disabled');
                } else {
                    key.setAttribute('disabled', 'true');
                    key.classList.add('disabled');
                }
            });
        }
    },

    setupShare() {
        if (this.elements.shareButton) {
            this.elements.shareButton.addEventListener('click', async () => {
                try {
                    const resultString = generateResultString();
                    
                    if (navigator.share) {
                        await navigator.share({
                            title: 'Horrordle',
                            text: resultString,
                            url: window.location.href
                        });
                    } else {
                        await navigator.clipboard.writeText(resultString);
                        this.showShareConfirmation();
                    }
                } catch (err) {
                    console.error('Failed to share/copy result:', err);
                    this.showError('Failed to share results');
                }
            });
        }
    },

    showShareConfirmation() {
        const confirmation = this.elements.copyConfirmation;
        if (confirmation) {
            confirmation.style.display = 'block';
            confirmation.style.opacity = '1';
            
            setTimeout(() => {
                confirmation.style.opacity = '0';
                setTimeout(() => {
                    confirmation.style.display = 'none';
                }, 300);
            }, 6000);
        }
    },

    displayStats() {
        const stats = gameState.state.stats;
        const elements = this.elements;
        
        // Update basic stats
        elements.gamesPlayed.textContent = stats.gamesPlayed;
        const winPercentage = stats.gamesPlayed > 0 ? 
            Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
        elements.winPercentage.textContent = `${winPercentage}%`;
        elements.currentStreak.textContent = stats.currentStreak;
        elements.maxStreak.textContent = stats.maxStreak;

        // Update distribution bars
        let totalWins = Object.values(stats.guessDistribution).reduce((acc, count) => acc + count, 0);
        
        Object.entries(stats.guessDistribution).forEach(([guess, count]) => {
            const bar = elements.distributionBars[guess];
            if (bar) {
                const percentage = totalWins > 0 ? (count / totalWins) * 100 : 0;
                bar.style.width = `${percentage}%`;
                bar.textContent = count;
                
                bar.classList.remove('correct');
                if (stats.lastGameWon && stats.lastWinGuesses.toString() === guess) {
                    bar.classList.add('correct');
                }
            }
        });
    }
};

// Debounce keyboard input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadGame() {
    try {
        // Try online load first
        const [dictionaryResponse, wordsResponse] = await Promise.all([
            fetch('https://jonwcole.github.io/horrordle/dictionary-v1.2.json'),
            fetch('https://jonwcole.github.io/horrordle/words-v1.6.json')
        ]);

        if (!dictionaryResponse.ok || !wordsResponse.ok) {
            throw new Error('Failed to load game data');
        }

        const dictionaryData = await dictionaryResponse.json();
        const wordsData = await wordsResponse.json();
        
        // Cache the data for offline use
        cacheGameData({
            dictionary: dictionaryData,
            words: wordsData,
            timestamp: new Date().toISOString()
        });

        return initializeGameWithData(dictionaryData, wordsData);

    } catch (error) {
        console.warn('Online load failed, trying offline data:', error);
        
        // Try loading from cache
        const cachedData = loadOfflineGameData();
        if (cachedData) {
            return initializeGameWithData(cachedData.dictionary, cachedData.words);
        }
        
        throw new Error('Unable to load game data online or offline');
    }
}

function initializeGameWithData(dictionaryData, wordsData) {
    const today = getLocalDateISOString(new Date());
    dictionary = dictionaryData.map(word => word.toUpperCase());
    
    const wordData = wordsData[today];
    if (!wordData) {
        throw new Error('No word found for today');
    }

    gameState.state.wordOfTheDay = wordData.word.toUpperCase();
    wordOfTheDayNormalized = normalizeWord(gameState.state.wordOfTheDay);
    gameState.state.hintOfTheDay = wordData.hint;
    gameState.state.gameDate = today;
    
    updateGameUI(gameState.state.wordOfTheDay, gameState.state.hintOfTheDay, wordData.context);
    gameState.save();
}



// ================== //
// 2. Core Game Logic //
// ================== //

let maxAttempts = 6;
let isRevealingGuess = false; // Flag to track reveal state

let currentGuess = []; // An array to hold the current guess's letters


function handleKeyPress(key) {
    if (gameState.state.isGameOver || inputDisabled) return;
    if (/^[A-Za-zÀ-ÿ]$/i.test(key) && currentGuess.length < 5) {
        currentGuess.push(key.toUpperCase());
        updateCurrentGuessDisplay();
    }
}

function submitGuess() {
    if (isRevealingGuess || gameState.state.isGameOver || currentGuess.length !== 5) return;

    isRevealingGuess = true;
    const guess = normalizeWord(currentGuess.join('').toUpperCase());

    if (!dictionary.includes(guess)) {
        shakeCurrentRow();
        isRevealingGuess = false;
        return;
    }

    if (guess !== wordOfTheDayNormalized) {
        gameState.state.incorrectGuesses++;
    }

    processGuess(guess);

    setTimeout(() => {
        if (gameState.state.incorrectGuesses >= 5) {
            if (!gameState.state.hintDisplayed) {
                gameElements.displayHint();
                gameState.state.hintDisplayed = true;
                gameState.save();
            }
        }

        if (!gameState.state.isGameOver) {
            handleGuessFinalization(guess);
            isRevealingGuess = false;
        }
    }, currentGuess.length * 500 + 600);
}

function processGuess(guess) {
    let wordArray = wordOfTheDayNormalized.split('');
    let result = [];
    
    // Mark correct positions
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === wordOfTheDayNormalized[i]) {
            result[i] = 'correct';
            wordArray[i] = null;
        } else {
            result[i] = 'absent';
        }
    }

    // Mark present positions
    for (let i = 0; i < guess.length; i++) {
        if (result[i] !== 'correct' && wordArray.includes(guess[i])) {
            result[i] = 'present';
            wordArray[wordArray.indexOf(guess[i])] = null;
        }
    }

    gameElements.updateTile(gameState.state.currentAttempt, guess, result);
    
    gameState.state.gameGuessColors.push(result);
    gameState.state.gameGuessLetters.push(guess.split(''));
    gameState.state.currentAttempt++;
    
    if (gameState.state.currentAttempt >= maxAttempts || guess === wordOfTheDayNormalized) {
        gameState.state.isGameOver = true;
        concludeGame(guess === wordOfTheDayNormalized);
    }
    
    gameState.save();
}

function handleGuessFinalization(guess) {
    currentGuess = [];
    
    // Check for hint display condition
    if (gameState.state.incorrectGuesses >= 5 && !gameState.state.hintDisplayed) {
        gameElements.displayHint();
        gameState.state.hintDisplayed = true;
        gameState.save();
    }

    const won = guess === wordOfTheDayNormalized;
    const lost = !won && gameState.state.currentAttempt >= maxAttempts;
    
    if (won || lost) {
        gameState.state.isGameOver = true;
        gameState.save();
    }
}

// Function to normalize non-standard characters
function normalizeWord(word) {
    const accentsMap = {
        'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a',
        'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
        'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o',
        'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
        'ñ': 'n', 'Ñ': 'N', 'ç': 'c', 'Ç': 'C'
    };

    return word
        .normalize('NFD') // Decompose characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .split('')
        .map(letter => accentsMap[letter] || letter) // Replace using accentsMap
        .join('');
}


// ============= //
// 3. UI Updates //
// ============= //

function updateCurrentGuessDisplay() {
    const currentRow = gameElements.elements.tileRows[currentAttempt];
    if (!currentRow) {
        console.error('Current row not found:', currentAttempt);
        return;
    }

    const tiles = currentRow.querySelectorAll('.tile');
    
    // Clear existing letters
    tiles.forEach(tile => {
        const front = tile.querySelector('.front');
        if (front) {
            front.textContent = '';
        }
    });

    // Update with current guess
    currentGuess.forEach((letter, index) => {
        const front = tiles[index]?.querySelector('.front');
        if (front) {
            front.textContent = letter;
        }
    });
}

function updateTiles(attempt, guess, result) {
    const row = gameElements.elements.tileRows[attempt];
    if (!row) return;

    const tiles = row.querySelectorAll('.tile');
    const allCorrect = result.every(status => status === 'correct');

    tiles.forEach((tile, index) => {
        const back = tile.querySelector('.back');
        const backText = tile.querySelector('.back-text');
        backText.textContent = guess[index];
        back.className = 'back';
        back.classList.add(result[index]);

        setTimeout(() => {
            tile.classList.add('flipped');

            if (allCorrect && index === tiles.length - 1) {
                setTimeout(() => {
                    tiles.forEach((celebrationTile, celebrationIndex) => {
                        setTimeout(() => {
                            celebrationTile.classList.add('tile-win-pop');
                        }, 100 * celebrationIndex);
                    });
                }, 500);
            }
        }, index * 500);

        tile.setAttribute('role', 'cell');
        tile.setAttribute('aria-label', `${guess[index]}, ${result[index]}`);
    });

    updateKeyboard(guess, result);
}

function shakeCurrentRow() {
    const currentRow = gameElements.elements.tileRows[currentAttempt];
    if (currentRow) {
        currentRow.classList.add('shake');
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 800);
    }
}

function displayEndGameMessage(won) {
    if (gameElements.elements.resultText) {
        gameElements.elements.resultText.textContent = won ? 'won' : 'lost';
    }
    
    gameElements.showSplatterEffects();
    
    setTimeout(() => {
        if (gameElements.elements.navButton) {
            gameElements.elements.navButton.click();
        }
    }, 3500);
}

function displayHint() {
    const hintElement = gameElements.elements.hint;
    const hintTextElement = gameElements.elements.hintText;
    
    if (hintElement && hintTextElement && !hintDisplayed) {
        hintElement.style.display = 'block';
        hintTextElement.textContent = hintOfTheDay;
        void hintElement.offsetWidth; // Force reflow
        hintElement.style.opacity = 1;
        hintDisplayed = true;
    }
}

function toggleOnScreenKeyboard(enable) {
    document.querySelectorAll('.key').forEach(button => {
        if (enable) {
            button.removeAttribute('disabled');
            button.classList.remove('disabled');
        } else {
            button.setAttribute('disabled', 'true');
            button.classList.add('disabled');
        }
    });
}

function updateKeyboard(guess, result) {
    const delay = 2500; // Fixed delay value
    
    setTimeout(() => {
        guess.split('').forEach((letter, index) => {
            const key = gameElements.elements.keyboardKeys.find(
                key => key.getAttribute('data-key') === letter
            );
            
            if (key) {
                if (result[index] === 'correct') {
                    key.classList.add('correct');
                } else if (result[index] === 'present' && !key.classList.contains('correct')) {
                    key.classList.add('present');
                } else if (!key.classList.contains('correct') && !key.classList.contains('present')) {
                    key.classList.add('absent');
                }
            }
        });
    }, delay);
}

function updateKeyboardState(cumulativeResults) {
    gameElements.elements.keyboardKeys.forEach(key => {
        const letter = key.getAttribute('data-key');
        const result = cumulativeResults[letter];
        if (result) {
            key.classList.remove('correct', 'present', 'absent');
            key.classList.add(result);
        }
    });
}

function updateGameUI(word, hint, context) {
    const elements = gameElements.elements;
    
    if (elements.hintText) {
        elements.hintText.textContent = hint || '';
    }
    if (elements.wordContent) {
        elements.wordContent.textContent = word || '';
    }
    if (context) {
        if (elements.contextText) {
            elements.contextText.textContent = context;
        }
        if (elements.context) {
            elements.context.style.display = 'block';
        }
    } else if (elements.context) {
        elements.context.style.display = 'none';
    }
}

// New function to reveal the word of the day if the player has lost
function revealWordOfTheDay() {
    const wordElement = document.getElementById('word-reveal'); // Make sure this is your correct element ID
    const wordContent = document.getElementById('word-content'); // And this
    if (wordElement && wordContent) {
        wordContent.textContent = wordOfTheDay; // Set text
        wordElement.style.display = 'flex'; // Ensure it's visible
        setTimeout(() => {
            wordElement.style.opacity = 1;
        }, 100);
    }
}

// New function to handle end game UI updates
function showEndGameMessage(won) {
    displayEndGameMessage(won); // Consolidate all UI display logic here
    toggleOnScreenKeyboard(false); // Disables the on-screen keyboard
}

function triggerUIAction(action) {
    switch (action) {
        case 'invalidGuess':
            shakeCurrentRow();
            break;
        case 'gameWon':
            // Any additional UI logic for winning the game goes here
            break;
        case 'gameLost':
            // Any additional UI logic for losing the game goes here
            revealWordOfTheDay();
            break;
    }

    // Common UI updates for end of the game regardless of win or loss
    displayEndGameMessage(action === 'gameWon'); // This assumes `displayEndGameMessage` takes a boolean for winning
    toggleOnScreenKeyboard(false); // Disables the on-screen keyboard for end of the game
}

// ======================== //
// 4. Game State Management //
// ======================== //

// Initialize or load game guess colors and letters from localStorage
let gameGuessColors = JSON.parse(localStorage.getItem('gameGuessColors')) || [];
let gameGuessLetters = JSON.parse(localStorage.getItem('gameGuessLetters')) || [];

function getLocalDateISOString(date) {
    const offset = date.getTimezoneOffset() * 60000; // Ensure offset is correctly applied
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 10);
}

function restoreGameStateIfPlayedToday() {
    const today = getLocalDateISOString(new Date());
    
    // Initialize gameState if needed
    if (!gameState.state.gameDate || gameState.state.gameDate !== today) {
        gameState.clear();
        return;
    }

    // Restore game board state
    gameState.state.gameGuessLetters.forEach((guess, attempt) => {
        const colors = gameState.state.gameGuessColors[attempt];
        gameElements.updateTile(attempt, guess.join(''), colors);
    });

    // Show hint if it was displayed
    if (gameState.state.hintDisplayed) {
        gameElements.displayHint();
    }

    // Handle game over state
    if (gameState.state.isGameOver) {
        gameElements.toggleKeyboard(false);
        if (gameState.state.stats.lastGameWon) {
            gameElements.showSplatterEffects();
        } else {
            gameElements.revealWord();
        }
        displayEndGameState();
    }
}

function displayCompletedMessage() {
    const completedMessageElement = document.getElementById('completed-message');
    if (completedMessageElement) {
        completedMessageElement.style.display = 'block'; // Show the completed message
    }
}

function restoreAttempt(attemptObj, attempt, cumulativeResults) {
    const row = gameElements.elements.tileRows[attempt];
    if (!row) return;

    const tiles = row.querySelectorAll('.tile');
    attemptObj.guess.split('').forEach((letter, index) => {
        const tile = tiles[index];
        if (tile) {
            const front = tile.querySelector('.front');
            const back = tile.querySelector('.back');
            const backText = tile.querySelector('.back-text');
            
            if (front && back && backText) {
                front.textContent = letter;
                backText.textContent = letter;
                back.className = 'back ' + attemptObj.result[index];
                tile.classList.add('flipped');
            }
        }

        // Update cumulative results for keyboard
        const result = attemptObj.result[index];
        if (!cumulativeResults[letter] || 
            result === 'correct' || 
            (result === 'present' && cumulativeResults[letter] !== 'correct')) {
            cumulativeResults[letter] = result;
        }
    });
}

function displayEndGameState() {
    if (gameState.state.stats.lastGameWon) {
        gameElements.displayEndGameMessage(true);
    } else {
        gameElements.displayEndGameMessage(false);
    }

    setTimeout(() => {
        if (gameElements.elements.navButton) {
            gameElements.elements.navButton.click();
        }
    }, 2500);
}



// ======================================= //
// 5. Event Listeners and User Interaction //
// ======================================= //

let inputDisabled = false; // flag to control input globally

// Handling virtual keyboard clicks
document.getElementById('keyboard').addEventListener('click', function(e) {
  if (e.target.matches('.key')) { // Now all keys, including special ones, are handled here
    const key = e.target.getAttribute('data-key');
    switch (key) {
      case 'ENTER':
        submitGuess();
        break;
      case 'BACKSPACE':
        deleteLastCharacter();
        updateCurrentGuessDisplay(); // Refresh the display to show the current guess state
        break;
      default:
        handleKeyPress(key); // For letter keys
    }
  }
});

// Handling physical keyboard input
document.addEventListener('keydown', function(e) {
  // Check if Ctrl, Cmd, or Alt is pressed
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return; // Do nothing if any of these keys are pressed
  }
  if (e.key === 'Enter') {
    submitGuess();
  } else if (e.key === 'Backspace') {
    e.preventDefault(); // Prevent the default backspace behavior (e.g., navigating back)
    deleteLastCharacter();
  } else {
    const key = e.key.toUpperCase();
    // Accept only alphabetical characters, and ignore non-letter keys
    if (/^[A-Z]$/i.test(key)) {
      handleKeyPress(key);
    }
  }
});

function deleteLastCharacter() {
  // Check if there's at least one character to remove
  if (currentGuess.length > 0) {
    currentGuess.pop(); // Remove the last letter from the current guess
    updateCurrentGuessDisplay(); // Update the display accordingly
  }
}


// ================================== //
// 6. Statistics and Endgame Handling //
// ================================== //

function displayStats() {
    const stats = gameState.state.stats;
    const elements = gameElements.elements;
    
    // Update basic stats
    elements.gamesPlayed.textContent = stats.gamesPlayed;
    const winPercentage = stats.gamesPlayed > 0 ? 
        Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
    elements.winPercentage.textContent = `${winPercentage}%`;
    elements.currentStreak.textContent = stats.currentStreak;
    elements.maxStreak.textContent = stats.maxStreak;

    // Update distribution bars
    let totalWins = Object.values(stats.guessDistribution).reduce((acc, count) => acc + count, 0);
    
    Object.entries(stats.guessDistribution).forEach(([guess, count]) => {
        const bar = elements.distributionBars[guess];
        if (bar) {
            const percentage = totalWins > 0 ? (count / totalWins) * 100 : 0;
            bar.style.width = `${percentage}%`;
            bar.textContent = count;
            
            bar.classList.remove('correct');
            if (stats.lastGameWon && stats.lastWinGuesses.toString() === guess) {
                bar.classList.add('correct');
            }
        }
    });
}

// ======================================= //
// 7. Utility Functions //
// ======================================= //

function generateResultString() {
    const dateParts = gameState.state.gameDate.split('-');
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    const formattedDate = `${month}/${day}`;

    const emojiMap = {
        'absent': '⬛',
        'present': '🟨',
        'correct': '🟥'
    };

    const resultString = gameState.state.gameGuessColors
        .map(guess => guess.map(status => emojiMap[status]).join(''))
        .join('\n');

    return `www.horrordle.app, ${formattedDate}\n\n${resultString}`;
}

document.getElementById('share-result').addEventListener('click', function() {
    const resultString = generateResultString();
    navigator.clipboard.writeText(resultString)
        .then(() => {
            // Display the copy confirmation
            document.getElementById('copy-confirmation').style.display = 'block';
            document.getElementById('copy-confirmation').style.opacity = '1';
            
            setTimeout(() => {
                document.getElementById('copy-confirmation').style.display = 'none';
                document.getElementById('copy-confirmation').style.opacity = '0';
            }, 6000);
        })
        .catch(err => console.error('Failed to copy result to clipboard:', err));
});

function disableInput() {
    // Here you should disable the keyboard and any other input forms you have.
    // This could be as simple as not allowing key presses to register or hiding the virtual keyboard if you have one.
    // Example:
    document.getElementById('keyboard').style.pointerEvents = 'none'; // Disables click events on the on-screen keyboard
    // You might also disable physical keyboard input by removing or disabling event listeners.
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize game state first
    gameState.init();
    
    // Initialize cached elements
    gameElements.init();
    
    // Load game data and restore state
    loadGame().then(() => {
        restoreGameStateIfPlayedToday();
        gameElements.displayStats(); // Show initial stats
    });
});

// Refresh every 12 hours (12 * 60 * 60 * 1000 ms)
setInterval(() => {
    location.reload(true); // true forces reload from server, not cache
}, 12 * 60 * 60 * 1000);

// Add error messaging system
function showError(message) {
    gameElements.showError(message);
}

// Add service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('https://jonwcole.github.io/horrordle/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}

const analytics = {
    logGuess(guess, isCorrect) {
        const data = {
            guess,
            attempt: gameState.state.currentAttempt,
            isCorrect,
            timestamp: new Date().toISOString()
        };
        // Send to analytics service
    },
    
    trackGameCompletion() {
        const stats = gameState.state.stats;
        const data = {
            won: stats.lastGameWon,
            attempts: stats.lastWinGuesses,
            date: stats.lastPlayedDate
        };
        // Send to analytics service
    }
};

function enhanceShareFeature() {
    // Add more detailed sharing options
    const shareData = {
        title: 'Horrordle',
        text: generateResultString(),
        url: window.location.href
    };

    if (navigator.share) {
        return navigator.share(shareData);
    } else {
        // Fallback to clipboard
        return navigator.clipboard.writeText(shareData.text);
    }
}

// Add offline gameplay capability
function cacheGameData() {
    const gameData = {
        dictionary,
        wordOfTheDay,
        gameDate,
        hintOfTheDay
    };
    localStorage.setItem('gameData', JSON.stringify(gameData));
}

function loadOfflineGameData() {
    const cached = localStorage.getItem('gameData');
    if (cached) {
        return JSON.parse(cached);
    }
    return null;
}

function setupShareButton() {
    const shareButton = gameElements.elements.shareButton;
    const copyConfirmation = gameElements.elements.copyConfirmation;
    
    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const resultString = generateResultString();
            
            try {
                if (navigator.share) {
                    // Use native share if available (mobile devices)
                    await navigator.share({
                        title: 'Horrordle',
                        text: resultString,
                        url: window.location.href
                    });
                } else {
                    // Fallback to clipboard
                    await navigator.clipboard.writeText(resultString);
                    if (copyConfirmation) {
                        copyConfirmation.style.display = 'block';
                        copyConfirmation.style.opacity = '1';
                        
                        setTimeout(() => {
                            copyConfirmation.style.opacity = '0';
                            setTimeout(() => {
                                copyConfirmation.style.display = 'none';
                            }, 300);
                        }, 6000);
                    }
                }
            } catch (err) {
                console.error('Failed to share/copy result:', err);
                gameElements.showError('Failed to share results');
            }
        });
    }
}

const gameState = {
    state: {
        currentAttempt: 0,
        isGameOver: false,
        incorrectGuesses: 0,
        hintDisplayed: false,
        gameGuessColors: [],
        gameGuessLetters: [],
        gameDate: '',
        wordOfTheDay: '',
        hintOfTheDay: '',
        stats: {
            gamesPlayed: 0,
            wins: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
            lastGameWon: false,
            lastWinGuesses: null,
            lastPlayedDate: null
        }
    },

    init() {
        this.load();
        // Check if it's a new day
        const today = getLocalDateISOString(new Date());
        if (this.state.gameDate !== today) {
            this.clear();
            this.state.gameDate = today;
            this.save();
        }
    },

    save() {
        localStorage.setItem('gameState', JSON.stringify(this.state));
    },

    load() {
        const saved = localStorage.getItem('gameState');
        if (saved) {
            this.state = JSON.parse(saved);
        }
    },

    clear() {
        this.state = {
            currentAttempt: 0,
            isGameOver: false,
            incorrectGuesses: 0,
            hintDisplayed: false,
            gameGuessColors: [],
            gameGuessLetters: [],
            gameDate: '',
            wordOfTheDay: '',
            hintOfTheDay: '',
            stats: this.state?.stats || {
                gamesPlayed: 0,
                wins: 0,
                currentStreak: 0,
                maxStreak: 0,
                guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
                lastGameWon: false,
                lastWinGuesses: null,
                lastPlayedDate: null
            }
        };
        this.save();
    },

    updateStats(won) {
        const stats = this.state.stats;
        stats.gamesPlayed += 1;
        if (won) {
            stats.wins += 1;
            stats.currentStreak += 1;
            stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
            stats.guessDistribution[this.state.currentAttempt] += 1;
            stats.lastGameWon = true;
            stats.lastWinGuesses = this.state.currentAttempt;
        } else {
            stats.currentStreak = 0;
            stats.lastGameWon = false;
        }
        stats.lastPlayedDate = this.state.gameDate;
        this.save();
    }
};

function concludeGame(won) {
    gameElements.toggleKeyboard(false);
    
    if (won) {
        gameElements.showSplatterEffects();
        setTimeout(() => {
            gameElements.displayEndGameMessage(true);
        }, 1500);
    } else {
        gameElements.revealWord();
        gameElements.displayEndGameMessage(false);
    }

    gameState.updateStats(won);
    gameElements.displayStats();

    setTimeout(() => {
        if (gameElements.elements.navButton) {
            gameElements.elements.navButton.click();
        }
    }, 2500);
}

const offlineStorage = {
    cacheGameData(data) {
        const cacheData = {
            ...data,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('gameData', JSON.stringify(cacheData));
    },

    loadGameData() {
        const cached = localStorage.getItem('gameData');
        if (!cached) return null;

        const data = JSON.parse(cached);
        const cacheAge = new Date() - new Date(data.timestamp);
        
        // Cache expires after 12 hours
        if (cacheAge > 12 * 60 * 60 * 1000) {
            localStorage.removeItem('gameData');
            return null;
        }
        
        return data;
    },

    clearCache() {
        localStorage.removeItem('gameData');
    }
};