// v0.9.6.1.1 //

// ================================== //
// 1. Initialization and Data Loading //
// ================================== //

let wordOfTheDay = '';
let dictionary = [];
let gameDate = ''; // Ensure this is declared globally for use in stats
let hintOfTheDay = '';
let wordOfTheDayNormalized = '';

async function loadGame() {
    try {
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const adjustedNow = new Date(now.getTime() - timezoneOffset);
        const today = adjustedNow.toISOString().slice(0, 10);

        // Check if today's date is the same as the stored game date
        if (StateManager.get('game.date') !== today) {
            // Reset game state for a new day
            StateManager.resetGameState();
            StateManager.set('game.date', today);
        }

        // Fetch and set up the dictionary
        const dictionaryResponse = await fetch('https://jonwcole.github.io/horrordle/dictionary-v1.2.json');
        const dictionaryData = await dictionaryResponse.json();
        dictionary = dictionaryData.map(word => word.toUpperCase());

        // Fetch and set up the word of the day
        const wordsResponse = await fetch('https://jonwcole.github.io/horrordle/words-v1.6.json');
        const wordsData = await wordsResponse.json();
        
        const wordData = wordsData[today];
        if (wordData) {
            // Update game state with new word data
            StateManager.set('game.wordOfDay', wordData.word.toUpperCase());
            StateManager.set('game.wordOfDayNormalized', normalizeWord(wordData.word.toUpperCase()));
            StateManager.set('game.hint.text', wordData.hint);
            StateManager.set('game.hint.context', wordData.context || '');

            // Update UI with the word data
            updateGameUI(
                StateManager.get('game.wordOfDay'),
                StateManager.get('game.hint.text'),
                StateManager.get('game.hint.context')
            );
        } else {
            // Display error message if word not found
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.innerHTML = "<span class='text-l'>Uh oh! No word for today.</span><br />Email <a href='mailto:jon@livingdead.co'>jon@livingdead.co</a> &amp; let him know.";
                errorMessage.style.display = 'block';
            }
            console.error('Word for today not found');
            return;
        }

        // Load saved state if it exists
        StateManager.loadFromStorage();

        // Subscribe to state changes
        StateManager.subscribe('game.isGameOver', (isGameOver) => {
            if (isGameOver) {
                disableInput();
                displayEndGameState();
            }
        });

        StateManager.subscribe('game.hint.displayed', (displayed) => {
            if (displayed) {
                displayHint();
            }
        });

    } catch (error) {
        console.error('Error loading game data:', error);
    }
}



// ================== //
// 2. Core Game Logic //
// ================== //

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
    const currentAttempt = StateManager.get('game.currentAttempt');
    const currentGuess = StateManager.get('game.guesses')[currentAttempt] || [];
    
    const rows = document.querySelectorAll('.tile-row-wrapper');
    const currentRow = rows[currentAttempt];
    
    if (!currentRow) {
        console.error('Current row not found:', currentAttempt);
        return;
    }

    const tiles = currentRow.querySelectorAll('.tile');

    // Clear existing letters
    tiles.forEach(tile => {
        const front = tile.querySelector('.front');
        if (!front) {
            console.error('Front div not found in tile');
            return;
        }
        front.textContent = '';
    });

    // Update tiles with current guess
    currentGuess.forEach((letter, index) => {
        const front = tiles[index].querySelector('.front');
        if (front) {
            front.textContent = letter;
        } else {
            console.error('Front div not found in tile at index:', index);
        }
    });
}

function updateTiles(attempt, guess, result) {
    const row = document.querySelector(`#game-board .tile-row-wrapper:nth-child(${attempt + 1})`);
    const tiles = row.querySelectorAll('.tile');
    const allCorrect = result.every(status => status === 'correct');

    // Update keyboard state
    const keyboardState = {...StateManager.get('ui.keyboardState')};
    guess.split('').forEach((letter, index) => {
        const currentStatus = result[index];
        const existingStatus = keyboardState[letter];
        
        // Only upgrade status if new status is better
        if (!existingStatus || 
            (currentStatus === 'correct') || 
            (currentStatus === 'present' && existingStatus !== 'correct')) {
            keyboardState[letter] = currentStatus;
        }
    });
    StateManager.set('ui.keyboardState', keyboardState);

    // Animate tiles
    tiles.forEach((tile, index) => {
        const back = tile.querySelector('.back');
        const backText = tile.querySelector('.back-text');
        backText.textContent = guess[index];
        back.className = 'back';
        back.classList.add(result[index]);

        setTimeout(() => {
            tile.classList.add('flipped');

            // Handle win animation
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
    });

    // Update keyboard display
    updateKeyboard(keyboardState);
}

function shakeCurrentRow() {
    const currentAttempt = StateManager.get('game.currentAttempt');
    const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${currentAttempt}"]`);
    
    if (currentRow) {
        currentRow.classList.add('shake');
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 800); // Match the CSS animation duration
    }
}

function displayEndGameMessage(won) {
    // Get word and context from state
    const wordOfDay = StateManager.get('game.wordOfDay');
    const context = StateManager.get('game.hint.context');

    // Update word reveal elements
    const wordElement = document.getElementById('word-reveal');
    const wordContent = document.getElementById('word-content');
    const contextElement = document.getElementById('context');
    const contextText = document.getElementById('context-text');

    if (wordElement && wordContent) {
        wordContent.textContent = wordOfDay;
        wordElement.style.display = 'flex';
        
        if (context && contextElement && contextText) {
            contextText.textContent = context;
            contextElement.style.display = 'block';
        }
        
        setTimeout(() => wordElement.style.opacity = 1, 100);
    }

    // Update the result text
    const resultTextElement = document.getElementById('result-text');
    if (resultTextElement) {
        resultTextElement.textContent = won ? 'won' : 'lost';
    }

    // Display splatter effects
    document.querySelectorAll('.splatter-box').forEach(box => {
        box.style.display = 'block';
        setTimeout(() => box.style.opacity = '1', 10);
    });

    // Show stats modal after delay
    setTimeout(() => {
        const navButton = document.querySelector('.nav-button-default-state');
        if (navButton) {
            navButton.click();
        }
    }, 3500);
}

function displayHint() {
    const hintElement = document.getElementById('hint');
    const isHintDisplayed = StateManager.get('game.hint.displayed');
    const hintText = StateManager.get('game.hint.text');
    
    if (hintElement && !isHintDisplayed) {
        // Update hint text
        const hintTextElement = document.getElementById('hint-text');
        if (hintTextElement) {
            hintTextElement.textContent = hintText;
        }

        // Make hint visible
        hintElement.style.display = 'block';

        // Force a reflow to ensure the opacity transition is triggered
        void hintElement.offsetWidth;

        // Start the fade-in
        hintElement.style.opacity = '1';

        // Update state to mark hint as displayed
        StateManager.set('game.hint.displayed', true);
    }
}

function toggleOnScreenKeyboard(enable) {
  document.querySelectorAll('.key').forEach(button => {
    if (enable) {
      button.removeAttribute('disabled');
      button.classList.remove('disabled'); // Assuming you use this class to style disabled buttons
    } else {
      button.setAttribute('disabled', 'true');
      button.classList.add('disabled');
    }
  });
}

function updateKeyboard(keyboardState) {
    document.querySelectorAll('.key').forEach(key => {
        const letter = key.getAttribute('data-key');
        if (letter && letter.length === 1) { // Only process letter keys
            // Remove existing status classes
            key.classList.remove('correct', 'present', 'absent');
            
            // Add new status class if exists
            const status = keyboardState[letter];
            if (status) {
                key.classList.add(status);
            }
        }
    });
}

function updateKeyboardState(cumulativeResults) {
    for (const [letter, result] of Object.entries(cumulativeResults)) {
        const keyElement = document.querySelector(`.key[data-key='${letter.toUpperCase()}']`);
        if (keyElement) {
            // Remove previous result classes before adding the new one to avoid duplicate visual states
            keyElement.classList.remove('correct', 'present', 'absent');
            keyElement.classList.add(result); // Add the appropriate class based on the latest result
        }
    }
}

function updateGameUI(word, hint, context) {
    const hintElement = document.getElementById('hint-text');
    const wordElement = document.getElementById('word-content');
    const contextElement = document.getElementById('context');
    const contextTextElement = document.getElementById('context-text');

    // Update hint and word
    if (hintElement) {
        hintElement.textContent = hint || ''; // Update with hint or empty string if not available
    }
    if (wordElement) {
        wordElement.textContent = word || ''; // Update with word or empty string if not available
    }

    // Check and update context
    if (context) {
        contextTextElement.textContent = context;
        contextElement.style.display = 'block'; // Display the context section if context exists
    } else {
        contextElement.style.display = 'none'; // Hide the context section if no context is provided
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

// Save function to update localStorage whenever changes are made to these arrays
function saveGuessesToLocalStorage() {
    localStorage.setItem('gameGuessColors', JSON.stringify(gameGuessColors));
    localStorage.setItem('gameGuessLetters', JSON.stringify(gameGuessLetters));
}


function saveGameProgress(guess, result) {
    const today = getLocalDateISOString(new Date());
    let gameProgress = JSON.parse(localStorage.getItem('gameProgress') || '{}');

    // Initialize game progress if empty or date mismatch
    if (!gameProgress.date || gameProgress.date !== today) {
        gameProgress = { date: today, attempts: [], gameEnded: false };
    }

    // Append current guess and result
    gameProgress.attempts.push({ guess, result, attemptNumber: currentAttempt });

    // Save the updated game progress
    localStorage.setItem('gameProgress', JSON.stringify(gameProgress));
}

function getLocalDateISOString(date) {
    const offset = date.getTimezoneOffset() * 60000; // Ensure offset is correctly applied
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 10);
}

function restoreGameStateIfPlayedToday() {
    // This function is now handled by StateManager.loadFromStorage()
    // and the state subscriptions in loadGame()
    return StateManager.loadFromStorage();
}

function displayCompletedMessage() {
    const completedMessageElement = document.getElementById('completed-message');
    const isGameOver = StateManager.get('game.isGameOver');
    
    if (completedMessageElement && isGameOver) {
        completedMessageElement.style.display = 'flex';
        
        // Update the message based on game outcome
        const resultText = document.getElementById('result-text');
        if (resultText) {
            const lastGameWon = StateManager.get('stats.lastGameWon');
            resultText.textContent = lastGameWon ? 'won' : 'lost';
        }
    }
}

function disableInput() {
    // Update state
    StateManager.set('ui.inputDisabled', true);
    
    // Disable on-screen keyboard
    const keyboard = document.getElementById('keyboard');
    if (keyboard) {
        keyboard.style.pointerEvents = 'none';
        keyboard.classList.add('disabled');
    }

    // Update keyboard button states
    document.querySelectorAll('.key').forEach(button => {
        button.setAttribute('disabled', 'true');
        button.classList.add('disabled');
    });
}



// ======================================= //
// 5. Event Listeners and User Interaction //
// ======================================= //

function handleKeyPress(key) {
    // Check if input is disabled or game is over
    if (StateManager.get('ui.inputDisabled') || StateManager.get('game.isGameOver')) {
        return;
    }

    // Get current guess from state
    let guesses = StateManager.get('game.guesses') || [];
    let currentGuess = guesses[StateManager.get('game.currentAttempt')] || [];

    // Handle letter input
    if (/^[A-Z]$/i.test(key) && currentGuess.length < 5) {
        // Create new guess array with added letter
        currentGuess = [...currentGuess, key.toUpperCase()];
        
        // Update guesses array in state
        guesses = [...guesses];
        guesses[StateManager.get('game.currentAttempt')] = currentGuess;
        StateManager.set('game.guesses', guesses);

        // Update display
        updateCurrentGuessDisplay();
    }
}

function deleteLastCharacter() {
    // Get current guess from state
    const currentAttempt = StateManager.get('game.currentAttempt');
    const guesses = [...StateManager.get('game.guesses')];
    const currentGuess = guesses[currentAttempt] || [];

    // Check if there's at least one character to remove
    if (currentGuess.length > 0) {
        // Remove the last letter
        currentGuess.pop();
        
        // Update state
        guesses[currentAttempt] = currentGuess;
        StateManager.set('game.guesses', guesses);
        
        // Update display
        updateCurrentGuessDisplay();
    }
}

// Handling virtual keyboard clicks
document.getElementById('keyboard').addEventListener('click', function(e) {
    if (e.target.matches('.key')) {
        const key = e.target.getAttribute('data-key');
        switch (key) {
            case 'ENTER':
                submitGuess();
                break;
            case 'BACKSPACE':
                deleteLastCharacter();
                break;
            default:
                handleKeyPress(key);
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
        e.preventDefault(); // Prevent the default backspace behavior
        deleteLastCharacter();
    } else {
        const key = e.key.toUpperCase();
        // Accept only alphabetical characters
        if (/^[A-Z]$/i.test(key)) {
            handleKeyPress(key);
        }
    }
});



// ================================== //
// 6. Statistics and Endgame Handling //
// ================================== //

const defaultStats = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
  lastGameWon: false,
  lastWinGuesses: null,
  lastPlayedDate: null,
};

function loadStats() {
  const stats = JSON.parse(localStorage.getItem('stats')) || defaultStats;
  return stats;
}

function saveStats(stats) {
  localStorage.setItem('stats', JSON.stringify(stats));
}

const stats = loadStats(); // Load stats at the start of the game
displayStats(); // Call this function to update the UI with the latest stats

function updateStats(win, guessesTaken) {
    stats.gamesPlayed += 1;
    if (win) {
        stats.wins += 1;
        stats.currentStreak += 1;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.guessDistribution[guessesTaken] += 1;
        stats.lastGameWon = true;
        stats.lastWinGuesses = guessesTaken;
    } else {
        stats.currentStreak = 0;
        stats.lastGameWon = false;
    }
    stats.lastPlayedDate = gameDate;
    localStorage.setItem('gameOutcome', win ? 'won' : 'lost');
    saveStats(stats);
    displayStats(); // Update the display every time stats are updated
}

function displayStats() {
  document.getElementById('games-played').textContent = stats.gamesPlayed;
  const winPercentage = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  document.getElementById('win-percentage').textContent = `${winPercentage}%`;
  document.getElementById('current-streak').textContent = stats.currentStreak;
  document.getElementById('max-streak').textContent = stats.maxStreak;

  let totalWins = Object.values(stats.guessDistribution).reduce((acc, count) => acc + count, 0);

  Object.entries(stats.guessDistribution).forEach(([guess, count]) => {
    const bar = document.getElementById(`distribution-${guess}`);
    const percentage = totalWins > 0 ? (count / totalWins) * 100 : 0;
    bar.style.width = `${percentage}%`; // Set the width of the bar to reflect the percentage
    bar.textContent = count; // Set the text inside the bar to reflect the actual count

    // Optionally, remove 'correct' class from all, then add back to only the relevant one
    bar.classList.remove('correct');
    if (stats.lastGameWon && stats.lastWinGuesses.toString() === guess) {
      bar.classList.add('correct');
    }
  });
}

function displayStatsModal() {
    const completedMessage = document.querySelector('.completed-message');
    const hintElement = document.getElementById('hint');

    // Display the completed message
    if (completedMessage) {
        completedMessage.style.display = 'flex';
    }

    // Also ensure the hint is visible
    if (hintElement) {
        hintElement.style.display = 'block';
        // Start transitioning to visible if it was previously hidden
        setTimeout(() => {
            hintElement.style.opacity = 1;
        }, 100); // A short delay to ensure the display change has taken effect
    }

    // Wait for 1200ms before simulating a click on the .nav-button-default-state to open the stats modal
    setTimeout(() => {
        const navButton = document.querySelector('.nav-button-default-state');
        if (navButton) {
            navButton.click();
        }
    }, 3500); // Delay of 1200ms
}

function concludeGame(won) {
    // Ensure we haven't already processed this game end
    if (StateManager.get('game.isGameOver')) {
        return;
    }

    // Update game state
    StateManager.set('game.isGameOver', true);
    
    // Update stats
    const currentAttempt = StateManager.get('game.currentAttempt');
    const stats = {
        ...StateManager.get('stats'),
        gamesPlayed: StateManager.get('stats.gamesPlayed') + 1,
        lastPlayedDate: StateManager.get('game.date')
    };

    if (won) {
        stats.wins++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.guessDistribution[currentAttempt]++;
        stats.lastGameWon = true;
        stats.lastWinGuesses = currentAttempt;
    } else {
        stats.currentStreak = 0;
        stats.lastGameWon = false;
    }

    // Update state with new stats
    StateManager.set('stats', stats);

    // Disable input
    StateManager.set('ui.inputDisabled', true);

    // Display end game UI
    displayEndGameMessage(won);
    displayCompletedMessage();

    // Save final state
    StateManager.saveToStorage();
}



// ==================== //
// 7. Utility Functions //
// ==================== //

function generateResultString() {
    const date = StateManager.get('game.date');
    const guesses = StateManager.get('game.guesses');

    // Format the date from "YYYY-MM-DD" to "M/D"
    const dateParts = date.split('-');
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    const formattedDate = `${month}/${day}`;

    const emojiMap = {
        'absent': '⬛',
        'present': '🟨',
        'correct': '🟥'
    };

    // Build the result string for each guess
    const resultString = guesses
        .map(guess => guess.result.map(status => emojiMap[status]).join(''))
        .join('\n');

    return `www.horrordle.app, ${formattedDate}\n\n${resultString}`;
}

document.getElementById('share-result').addEventListener('click', function() {
    const resultString = generateResultString();
    navigator.clipboard.writeText(resultString)
        .then(() => {
            // Display the copy confirmation instead of an alert
            document.getElementById('copy-confirmation').style.display = 'block';
            document.getElementById('copy-confirmation').style.opacity = '1';
            
            // Optionally, you might want to hide the confirmation after a few seconds
            setTimeout(() => {
                document.getElementById('copy-confirmation').style.display = 'none';
                document.getElementById('copy-confirmation').style.opacity = '0';
            }, 6000); // Adjust time as needed
        })
        .catch(err => console.error('Failed to copy result to clipboard:', err));
});

document.addEventListener('DOMContentLoaded', function() {
  
    // Initially display instructions if it's user's first visit
    if (!localStorage.getItem('hasVisited')) {
        const instructionsElement = document.querySelector('.instructions');
        if (instructionsElement) {
            instructionsElement.style.display = 'block';
            setTimeout(() => instructionsElement.style.opacity = 1, 10);
        }
    }

    // Event listener for the dismiss button/link
    const dismissBtn = document.querySelector('.instructions-dismiss');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default action if it's a link
            localStorage.setItem('hasVisited', 'true'); // Set 'hasVisited' to true
        });
    }
    
    // Your existing page load functions
    loadGame(); // Example of other functions that run on page load
    restoreGameStateIfPlayedToday(); // Another example function
});

// Refresh every 12 hours (12 * 60 * 60 * 1000 ms)
setInterval(() => {
    location.reload(true); // true forces reload from server, not cache
}, 12 * 60 * 60 * 1000);

// ================================== //
// 1. State Management System         //
// ================================== //

const STORAGE_VERSION = '1.0';

const gameState = {
    version: STORAGE_VERSION,
    game: {
        wordOfDay: '',
        wordOfDayNormalized: '',
        currentAttempt: 0,
        isGameOver: false,
        guesses: [],
        hint: {
            displayed: false,
            text: '',
            context: ''
        },
        date: ''
    },
    ui: {
        isAnimating: false,
        modalOpen: false,
        keyboardState: {},
        inputDisabled: false
    },
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
};

// State management methods
const StateManager = {
    // Get entire state or specific path
    get: function(path = '') {
        if (!path) return gameState;
        return path.split('.').reduce((obj, key) => obj?.[key], gameState);
    },

    // Update state with validation
    set: function(path, value) {
        const parts = path.split('.');
        let current = gameState;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                console.error(`Invalid state path: ${path}`);
                return false;
            }
            current = current[parts[i]];
        }

        const lastPart = parts[parts.length - 1];
        if (!(lastPart in current)) {
            console.error(`Invalid state path: ${path}`);
            return false;
        }

        current[lastPart] = value;
        this.saveToStorage();
        this.notifyStateChange(path, value);
        return true;
    },

    // Storage management
    saveToStorage: function() {
        const storageData = {
            version: STORAGE_VERSION,
            state: gameState
        };
        localStorage.setItem('horrordle_state', JSON.stringify(storageData));
    },

    loadFromStorage: function() {
        const stored = localStorage.getItem('horrordle_state');
        if (!stored) return false;

        try {
            const data = JSON.parse(stored);
            
            // Version check and migration
            if (data.version !== STORAGE_VERSION) {
                this.migrateStorage(data);
                return;
            }

            // Restore state
            Object.assign(gameState, data.state);
            return true;
        } catch (error) {
            console.error('Error loading state:', error);
            return false;
        }
    },

    migrateStorage: function(oldData) {
        // Handle migration from old storage format
        // For now, just reset if versions don't match
        localStorage.removeItem('horrordle_state');
        console.log('Storage version mismatch - state reset');
    },

    // Event system for state changes
    subscribers: new Map(),

    subscribe: function(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(callback);
    },

    unsubscribe: function(path, callback) {
        if (this.subscribers.has(path)) {
            this.subscribers.get(path).delete(callback);
        }
    },

    notifyStateChange: function(path, value) {
        if (this.subscribers.has(path)) {
            this.subscribers.get(path).forEach(callback => callback(value));
        }
    },

    // Reset state
    resetGameState: function() {
        gameState.game = {
            wordOfDay: '',
            wordOfDayNormalized: '',
            currentAttempt: 0,
            isGameOver: false,
            guesses: [],
            hint: {
                displayed: false,
                text: '',
                context: ''
            },
            date: ''
        };
        gameState.ui = {
            isAnimating: false,
            modalOpen: false,
            keyboardState: {},
            inputDisabled: false
        };
        this.saveToStorage();
    }
};

function submitGuess() {
    // Get current state
    const isRevealingGuess = StateManager.get('ui.isAnimating');
    const isGameOver = StateManager.get('game.isGameOver');
    const currentAttempt = StateManager.get('game.currentAttempt');
    const guesses = StateManager.get('game.guesses') || [];
    const currentGuess = guesses[currentAttempt] || [];

    if (isRevealingGuess || isGameOver || !currentGuess || currentGuess.length !== 5) {
        return;
    }

    // Set animating state
    StateManager.set('ui.isAnimating', true);

    const guessWord = normalizeWord(currentGuess.join('').toUpperCase());
    const wordOfDayNormalized = StateManager.get('game.wordOfDayNormalized');

    // Check if word is valid
    if (!dictionary.includes(guessWord)) {
        shakeCurrentRow();
        StateManager.set('ui.isAnimating', false);
        return;
    }

    // Process the guess
    processGuess(guessWord);

    // Set timeout for post-guess processing
    setTimeout(() => {
        if (StateManager.get('game.currentAttempt') >= 5 && !StateManager.get('game.hint.displayed')) {
            StateManager.set('game.hint.displayed', true);
        }

        if (!StateManager.get('game.isGameOver')) {
            handleGuessFinalization(guessWord);
            StateManager.set('ui.isAnimating', false);
        }
    }, 5 * 500 + 600); // Use fixed delay for consistency
}

function handleGuessFinalization(guess) {
    const currentAttempt = StateManager.get('game.currentAttempt');
    const wordOfDayNormalized = StateManager.get('game.wordOfDayNormalized');
    
    const won = guess === wordOfDayNormalized;
    const lost = !won && currentAttempt >= 6;
    
    if (won || lost) {
        StateManager.set('game.isGameOver', true);
        concludeGame(won);
    }
}

function processGuess(guess) {
    const wordOfDayNormalized = StateManager.get('game.wordOfDayNormalized');
    let wordArray = wordOfDayNormalized.split('');
    let result = [];
    
    // Mark correct positions
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === wordOfDayNormalized[i]) {
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

    // Update UI
    updateTiles(StateManager.get('game.currentAttempt'), guess, result);

    // Update state with new guess
    let guesses = [...(StateManager.get('game.guesses') || [])];
    guesses[StateManager.get('game.currentAttempt')] = {
        word: guess.split(''),
        result: result
    };
    StateManager.set('game.guesses', guesses);

    // Increment attempt counter
    StateManager.set('game.currentAttempt', StateManager.get('game.currentAttempt') + 1);

    // Check for game over conditions
    const maxAttempts = 6;
    if (StateManager.get('game.currentAttempt') >= maxAttempts || guess === wordOfDayNormalized) {
        StateManager.set('game.isGameOver', true);
        concludeGame(guess === wordOfDayNormalized);
    }
}

function displayEndGameState() {
    // Get current state
    const wordOfDay = StateManager.get('game.wordOfDay');
    const context = StateManager.get('game.hint.context');
    const isGameWon = StateManager.get('stats.lastGameWon');

    // Update word reveal
    const wordElement = document.getElementById('word-reveal');
    const wordContent = document.getElementById('word-content');
    const contextElement = document.getElementById('context');
    const contextText = document.getElementById('context-text');

    if (wordElement && wordContent) {
        wordContent.textContent = wordOfDay;
        wordElement.style.display = 'flex';
        
        if (context && contextElement && contextText) {
            contextText.textContent = context;
            contextElement.style.display = 'block';
        }
        
        setTimeout(() => wordElement.style.opacity = 1, 100);
    }

    // Show completed message
    const completedMessage = document.querySelector('.completed-message');
    if (completedMessage) {
        completedMessage.style.display = 'flex';
    }

    // Show hint if not already displayed
    const hintElement = document.getElementById('hint');
    if (hintElement && !StateManager.get('game.hint.displayed')) {
        hintElement.style.display = 'block';
        setTimeout(() => {
            hintElement.style.opacity = 1;
        }, 100);
    }

    // Display splatter effects
    document.querySelectorAll('.splatter-box').forEach(box => {
        box.style.display = 'block';
        setTimeout(() => box.style.opacity = '1', 10);
    });

    // Update result text
    const resultTextElement = document.getElementById('result-text');
    if (resultTextElement) {
        resultTextElement.textContent = isGameWon ? 'won' : 'lost';
    }

    // Show stats modal after delay
    setTimeout(() => {
        const navButton = document.querySelector('.nav-button-default-state');
        if (navButton) {
            navButton.click();
        }
    }, 3500);
}
