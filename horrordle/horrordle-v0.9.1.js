// ================================== //
// 1. Initialization and Data Loading //
// ================================== //

let wordOfTheDay = '';
let dictionary = [];
let gameDate = ''; // Ensure this is declared globally for use in stats
let hintOfTheDay = '';

async function loadGame() {
    try {
        // Fetch and set up the dictionary
        const dictionaryResponse = await fetch('https://jonwcole.github.io/horrordle/dictionary.json');
        const dictionaryData = await dictionaryResponse.json();
        dictionary = dictionaryData.map(word => word.toUpperCase());

        // Fetch and set up the word of the day
        const wordsResponse = await fetch('https://jonwcole.github.io/horrordle/words.json');
        const wordsData = await wordsResponse.json();
        
        // Get today's date and word data as before
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const adjustedNow = new Date(now - timezoneOffset);
        const today = adjustedNow.toISOString().slice(0, 10);

        const wordData = wordsData[today];
        if (wordData) {
            // Set up the game with the word of the day and hint
            wordOfTheDay = wordData.word.toUpperCase();
            hintOfTheDay = wordData.hint;
            gameDate = today;

            localStorage.setItem('gameDate', gameDate);

            // Call the UI update function instead of updating UI elements here
            updateGameUI(wordOfTheDay, hintOfTheDay);
        } else {
            console.error('Word for today not found');
        }
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}


// ================== //
// 2. Core Game Logic //
// ================== //

let currentAttempt = 0;
let maxAttempts = 6;
let isGameOver = false;
let incorrectGuesses = 0;
let hintDisplayed = false;

let currentGuess = []; // An array to hold the current guess's letters


function handleKeyPress(key) {
    if (isGameOver || inputDisabled) return;
    if (/^[A-Z]$/i.test(key) && currentGuess.length < 5) {
        currentGuess.push(key.toUpperCase());
        updateCurrentGuessDisplay();
    }
}

function submitGuess() {
    if (isGameOver || currentGuess.length < 5) return;
    const guess = currentGuess.join('').toUpperCase();
    if (!dictionary.includes(guess)) {
        shakeCurrentRow();
        return;
    }
    if (guess !== wordOfTheDay) {
        incorrectGuesses++;
    }
    processGuess(guess);
    setTimeout(() => {
        handleGuessFinalization(guess);
    }, currentGuess.length * 500 + 600);
}

function processGuess(guess) {
    let wordArray = wordOfTheDay.split('');
    let result = [];
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === wordOfTheDay[i]) {
            result[i] = 'correct';
            wordArray[i] = null;
        } else {
            result[i] = 'absent';
        }
    }
    for (let i = 0; i < guess.length; i++) {
        if (result[i] !== 'correct' && wordArray.includes(guess[i])) {
            result[i] = 'present';
            wordArray[wordArray.indexOf(guess[i])] = null;
        }
    }
    updateTiles(currentAttempt, guess, result);
    gameGuessColors.push(result);
    gameGuessLetters.push(guess.split(''));
    if (currentAttempt >= maxAttempts - 1 || guess === wordOfTheDay) {
        saveGuessesToLocalStorage();
    }
}

function handleInvalidGuess() {
    triggerUIAction('invalidGuess'); // Proposed indirect call
}

function handleGuessFinalization(guess) {
    currentAttempt++;
    currentGuess = [];
    const won = guess === wordOfTheDay;
    const lost = !won && currentAttempt >= maxAttempts;
    
    if (won || lost) {
        isGameOver = true;
        updateStats(won, currentAttempt); // Updates the stats
        
        // This directly manipulates the UI; it should trigger a UI action instead.
        // showEndGameMessage(won); // Previous direct call
        triggerUIAction(won ? 'gameWon' : 'gameLost'); // Proposed indirect call
    }
    
    if (incorrectGuesses >= 5 && !hintDisplayed) {
        // This already calls a UI function which is fine as it's a single purpose.
        displayHint(); 
    }
}


// ============= //
// 3. UI Updates //
// ============= //

function updateCurrentGuessDisplay() {
  const rows = document.querySelectorAll('.tile-row-wrapper'); // Get all rows
  const currentRow = rows[currentAttempt]; // Get the current row based on the current attempt
  if (!currentRow) {
    console.error('Current row not found:', currentAttempt);
    return;
  }

  const tiles = currentRow.querySelectorAll('.tile'); // Get tiles in the current row

  // Clear existing letters in the current row's tiles
  tiles.forEach(tile => {
    const front = tile.querySelector('.front');
    if (!front) {
      console.error('Front div not found in tile');
      return; // Skip this tile to prevent errors
    }
    front.textContent = ''; // Reset the text content of the front div
  });

  // Update tiles with the current guess letters
  currentGuess.forEach((letter, index) => {
    const front = tiles[index].querySelector('.front');
    if (front) {
      front.textContent = letter; // Set the letter in the front div
    } else {
      console.error('Front div not found in tile at index:', index);
    }
  });
}

function updateTiles(attempt, guess, result) {
  const row = document.querySelector(`#game-board .tile-row-wrapper:nth-child(${attempt + 1})`);
  const tiles = row.querySelectorAll('.tile');

  tiles.forEach((tile, index) => {
    // Set up the back face with the guessed letter and status class before starting the animation
    const back = tile.querySelector('.back');
    back.textContent = guess[index]; // Optionally, set the letter here as well for a reveal effect
    back.className = 'back'; // Reset any previous result classes
    back.classList.add(result[index]); // Preemptively add the result class to the back
    
    // Delay each tile's flip animation to visualize them one by one
    setTimeout(() => {
      // Start the flip animation
      tile.classList.add('flipped');
    }, index * 500); // Stagger the start of each tile's flip
  });

  updateKeyboard(guess, result);
}

function shakeCurrentRow() {
    const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${currentAttempt}"]`);
    if (currentRow) {
        currentRow.classList.add('shake');
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 800); // Match the CSS animation duration
    }
}

function displayEndGameMessage(won) {
    
    const hintElement = document.querySelector('.hint');
    if (hintElement && hintOfTheDay) {
        hintElement.textContent = hintOfTheDay; // Set the hint text
        hintElement.style.display = 'block';
        setTimeout(() => hintElement.style.opacity = 1, 10); // Start the fade-in
    }

    // Display the success or failure message
    const messageDiv = won ? document.querySelector('.success') : document.querySelector('.failure');
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.opacity = 1;
        setTimeout(() => {
            // After showing the message, fade it out
            messageDiv.style.opacity = 0;
            setTimeout(() => {
                messageDiv.style.display = 'none'; // Hide the message

                // Simulate a click on the nav button to open the stats modal after the hint and message have been shown
                const navButton = document.querySelector('.nav-button-default-state');
                if (navButton) {
                    navButton.click();
                }
            }, 400); // Wait for fade out
        }, 2400); // Duration message is shown
    }, 600); // Ensure display:block is applied
}

function displayHint() {
  const hintElement = document.getElementById('hint');
  if (hintElement && !hintDisplayed) {
    hintElement.style.display = 'block'; // Make the hint visible

    // Force a reflow to ensure the opacity transition is triggered
    void hintElement.offsetWidth;

    // Start the fade-in
    hintElement.style.opacity = 1;

    hintDisplayed = true; // Mark the hint as displayed
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

function updateKeyboard(guess, result) {
  // Set a fixed delay value in milliseconds
  const delayBeforeUpdate = 2500; // For example, 2.5 seconds

  setTimeout(() => {
    // Update the keyboard after the delay
    guess.split('').forEach((letter, index) => {
      const key = document.querySelector(`.key[data-key='${letter}']`);
      if (result[index] === 'correct') {
        key.classList.add('correct');
      } else if (result[index] === 'present') {
        if (!key.classList.contains('correct')) {
          key.classList.add('present');
        }
      } else {
        if (!key.classList.contains('correct') && !key.classList.contains('present')) {
          key.classList.add('absent');
        }
      }
    });
  }, delayBeforeUpdate);
}

function updateGameUI(word, hint) {
    const hintElement = document.getElementById('hint');
    if (hintElement) {
        hintElement.textContent = hint || ''; // Update with hint or empty string if not available
    }
    
    const wordElement = document.getElementById('word-content');
    if (wordElement) {
        wordElement.textContent = word || ''; // Update with word or empty string if not available
    }
    
}

// New function to reveal the word of the day if the player has lost
function revealWordOfTheDay() {
    const wordElement = document.getElementById('word');
    if (wordElement) {
        wordElement.style.display = 'flex';
        setTimeout(() => {
            wordElement.style.opacity = 1;
        }, 100);
    }
}

// New function to handle end game UI updates
function showEndGameMessage(won) {
    displayEndGameMessage(won); // Calls existing function to show the message
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

function updateUIFromRestoredState(guessLetters, guessColors, gameOutcome) {
    // Update tiles based on restored state
    guessLetters.forEach((letters, attempt) => {
        updateTilesFromState(attempt, letters, guessColors[attempt]);
    });

    // Display hint if it was previously shown
    if (hintDisplayed) {
        displayHint(); // Ensure this function adjusts the UI to show the hint again
    }

    // Update stats UI based on the restored state
    displayStats(); // Assuming this function can read from the `stats` object and update the UI accordingly

    // Optionally, reveal the word of the day if the game was lost and not won
    if (gameOutcome === 'lost') {
        revealWordOfTheDay(); // UI function to reveal the word
    }
}

function updateTilesFromState(attempt, letters, guessColors) {
    // Assuming the game board is structured with rows having a specific attribute or class to identify them
    const row = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
    if (!row) {
        console.error('Row not found for attempt:', attempt);
        return;
    }
    
    const tiles = row.querySelectorAll('.tile');
    letters.forEach((letter, index) => {
        if (tiles[index]) {
            const tile = tiles[index];
            // Update the front face of the tile with the letter
            const front = tile.querySelector('.front');
            if (front) {
                front.textContent = letter;
            }
            
            // Set the color based on the guessColors array
            const back = tile.querySelector('.back');
            if (back) {
                back.textContent = letter; // Optionally set the letter on the back as well
                back.className = 'back'; // Reset class list
                back.classList.add(guessColors[index]); // Add the class based on color status
            }
            
            // Add the flipped class if not already present to show the letter/color
            if (!tile.classList.contains('flipped')) {
                tile.classList.add('flipped');
            }
        }
    });
}


// ======================== //
// 4. Game State Management //
// ======================== //

let gameGuessColors = []; // Stores the result colors (correct, present, absent) for each guess.
let gameGuessLetters = []; // Stores the actual letters guessed in each attempt.

function saveGuessesToLocalStorage() {
localStorage.setItem('gameGuessColors', JSON.stringify(gameGuessColors));
localStorage.setItem('gameGuessLetters', JSON.stringify(gameGuessLetters));
}

function restoreGameStateIfPlayedToday() {
    const stats = JSON.parse(localStorage.getItem('stats')) || {};
    const today = getLocalDateISOString(); // Use local date
    const gameOutcome = localStorage.getItem('gameOutcome');

    if (stats.lastPlayedDate === today) {
        disableInput(); // Prevent further input

        // Restore game state from localStorage
        const restoredGameGuessColors = JSON.parse(localStorage.getItem('gameGuessColors') || '[]');
        const restoredGameGuessLetters = JSON.parse(localStorage.getItem('gameGuessLetters') || '[]');
        isGameOver = gameOutcome !== null; // Ensure isGameOver reflects restored state

        // Check if hint was displayed and show again if necessary
        hintDisplayed = localStorage.getItem('hintDisplayed') === 'true';
        if (hintDisplayed) {
            displayHint(); // Make sure this function is capable of showing the hint appropriately
        }

        incorrectGuesses = restoredGameGuessLetters.length; // Assuming incorrect guesses can be derived from attempts

        // Trigger UI updates based on the restored state
        updateUIFromRestoredState(restoredGameGuessLetters, restoredGameGuessColors, gameOutcome);

        // Display the stats if the game had been completed
        if (gameOutcome === 'won' || gameOutcome === 'lost') {
            displayStats(); // Make sure stats are displayed if the game was previously completed
        }

        // If the game was lost, reveal the word of the day
        if (gameOutcome === 'lost') {
            revealWordOfTheDay(); // Ensure this function reveals the word of the day
        }
    }
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
        completedMessage.style.display = 'block';
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
    }, 1200); // Delay of 1200ms
}


// ==================== //
// 7. Utility Functions //
// ==================== //

function generateResultString() {
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
    return `Horrordle, ${date}\n\n${resultString}`;
}

document.getElementById('share-result').addEventListener('click', function() {
    const resultString = generateResultString();
    navigator.clipboard.writeText(resultString)
        .then(() => alert('Result copied to clipboard!'))
        .catch(err => console.error('Failed to copy result to clipboard:', err));
});

function getLocalDateISOString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    const day = now.getDate();
    // Format month and day to ensure two digits
    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedDay = day < 10 ? `0${day}` : day;
    // Construct an ISO-like string with local date components
    return `${year}-${formattedMonth}-${formattedDay}`;
}

function disableInput() {
    // Here you should disable the keyboard and any other input forms you have.
    // This could be as simple as not allowing key presses to register or hiding the virtual keyboard if you have one.
    // Example:
    document.getElementById('keyboard').style.pointerEvents = 'none'; // Disables click events on the on-screen keyboard
    // You might also disable physical keyboard input by removing or disabling event listeners.
}

document.addEventListener('DOMContentLoaded', () => {
    loadGame(); // Make sure this still runs to load the game data
    restoreGameStateIfPlayedToday(); // Check if we need to restore state
});