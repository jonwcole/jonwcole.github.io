// v 0.9.4.03 //

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
        const dictionaryResponse = await fetch('https://jonwcole.github.io/horrordle/dictionary-v1.json');
        const dictionaryData = await dictionaryResponse.json();
        dictionary = dictionaryData.map(word => word.toUpperCase());

        // Fetch and set up the word of the day
        const wordsResponse = await fetch('https://jonwcole.github.io/horrordle/words-v1.json');
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
let isRevealingGuess = false; // Flag to track reveal state

let currentGuess = []; // An array to hold the current guess's letters


function handleKeyPress(key) {
    if (isGameOver || inputDisabled) return;
    if (/^[A-Z]$/i.test(key) && currentGuess.length < 5) {
        currentGuess.push(key.toUpperCase());
        updateCurrentGuessDisplay();
    }
}

function submitGuess() {
    // Ensure we're not already revealing a guess, the game isn't over, and the guess has exactly 5 letters
    if (isRevealingGuess || isGameOver || currentGuess.length !== 5) return;

    isRevealingGuess = true; // Prevent further submissions during the reveal
    const guess = currentGuess.join('').toUpperCase();

    if (!dictionary.includes(guess)) {
        shakeCurrentRow();
        isRevealingGuess = false; // Allow submissions again if the guess is invalid
        return;
    }

    if (guess !== wordOfTheDay) {
        incorrectGuesses++;
    }
    processGuess(guess);

    setTimeout(() => {
        if (incorrectGuesses >= 5 && !hintDisplayed) {
            displayHint();
            hintDisplayed = true; // Ensure the hint is only displayed once
        }

        handleGuessFinalization(guess);
        isRevealingGuess = false; // Allow submissions again after handling the guess
    }, currentGuess.length * 500 + 600);
}

function processGuess(guess) {
    let wordArray = wordOfTheDay.split('');
    let result = [];
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === wordOfTheDay[i]) {
            result.push('correct');
            wordArray[i] = null; // Mark as matched
        } else if (wordArray.includes(guess[i])) {
            result.push('present');
            wordArray[wordArray.indexOf(guess[i])] = null; // Prevent re-matching
        } else {
            result.push('absent');
        }
    }

    // Update the UI to reflect this guess
    updateTiles(currentAttempt, guess, result);

    // Append this guess and its result to our tracking arrays
    gameGuessColors.push(result);
    gameGuessLetters.push(guess.toUpperCase().split(''));

    // Save the updated state
    saveCurrentGameState();
    
    // Continue with any additional processing...
}

function saveCurrentGameState(gameWon) {
    const gameState = {
        gameDate: gameDate,
        gameGuessColors: gameGuessColors,
        gameGuessLetters: gameGuessLetters,
        currentAttempt: currentAttempt,
        incorrectGuesses: incorrectGuesses,
        hintDisplayed: hintDisplayed,
        isGameOver: isGameOver,
        gameWon: gameWon
    };

    localStorage.setItem('horrordleGameState', JSON.stringify(gameState));
}

function handleInvalidGuess() {
    triggerUIAction('invalidGuess'); // Proposed indirect call
}

function handleGuessFinalization(guess) {
    currentAttempt++;
    currentGuess = [];
    
    // Check for hint display condition right before concluding the game
    if (incorrectGuesses >= 5 && !hintDisplayed) {
        displayHint();
        hintDisplayed = true; // Prevent the hint from being displayed more than once
    }

    const won = guess === wordOfTheDay;
    const lost = !won && currentAttempt >= maxAttempts;
    
    if (won || lost) {
        isGameOver = true;
        concludeGame(won);
    }
}

function startNewGame() {
    // Reset game variables to their initial state
    currentAttempt = 0;
    gameGuessColors = [];
    gameGuessLetters = [];
    isGameOver = false;
    incorrectGuesses = 0;
    hintDisplayed = false;
    isRevealingGuess = false;
    currentGuess = 0;

    // Possibly reset other necessary parts of your game state here...

    // Update the UI to reflect the reset state
    resetGameBoardUI(); // You'll need to implement this function to clear the game board
    toggleOnScreenKeyboard(true); // Re-enable the on-screen keyboard if it was disabled
    updateGameUI(wordOfTheDay, hintOfTheDay); // Update the game UI to the starting state
    // Ensure any end-game messages are hidden
    // ...

    // If you're dynamically generating the word of the day, you might need to call that function here too
    // loadWordOfTheDay(); // Example function call to set a new word of the day

    // Clear any saved game state that might exist
    localStorage.removeItem('horrordleGameState');
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
    if (!row) {
        console.error('Row not found for attempt:', attempt);
        return; // Early return if the row is not found
    }
    
    const tiles = row.querySelectorAll('.tile');
    tiles.forEach((tile, index) => {
        // Attempt to find the back face and back text elements of the tile
        const back = tile.querySelector('.back');
        const backText = tile.querySelector('.back-text');
        
        if (back && backText) { // Ensure both elements exist
            backText.textContent = guess[index]; // Update back text with the current letter
            back.className = 'back'; // Reset classes
            back.classList.add(result[index]); // Add the appropriate class based on the result
            
            // Delay the flip animation
            setTimeout(() => {
                tile.classList.add('flipped');
            }, index * 500);
        } else {
            console.error('Failed to find .back or .back-text in tile:', tile);
        }
    });

    // Assuming updateKeyboard is used to update the state of the on-screen keyboard based on the guess
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
    const hintWord = document.getElementById('hint-text');
    if (hintElement && hintOfTheDay) {
        hintWord.textContent = hintOfTheDay; // Set the hint text
        hintElement.style.display = 'block';
        setTimeout(() => hintElement.style.opacity = 1, 10); // Start the fade-in
    }

    // Display the success or failure message
    if (won) {
        const successDiv = document.querySelector('.success');
        successDiv.style.display = 'flex';
        // Delay the opacity transition slightly
        setTimeout(() => successDiv.style.opacity = '1', 10);
    } else {
        document.querySelectorAll('.splatter-box').forEach(box => {
            box.style.display = 'block';
            // Delay the opacity transition slightly
            setTimeout(() => box.style.opacity = '1', 10);
        });
    }

    setTimeout(() => {

        // Simulate a click on the nav button to open the stats modal after the hint and message have been shown
        const navButton = document.querySelector('.nav-button-default-state');
        if (navButton) {
            navButton.click();
        }
    }, 2500); // Wait for fade out
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
    const hintElement = document.getElementById('hint-text');
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

function resetGameBoardUI() {
    // Clear guess tiles
    document.querySelectorAll('.tile').forEach(tile => {
        const front = tile.querySelector('.front');
        const back = tile.querySelector('.back');
        if (front) front.textContent = ''; // Clear front tile text
        if (back) {
            back.textContent = ''; // Clear back tile text
            back.className = 'back'; // Reset any coloring/styling
        }
        tile.classList.remove('flipped'); // Reset flipped state if any
    });

    // Reset the on-screen keyboard appearance
    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('correct', 'present', 'absent'); // Remove color coding
        key.removeAttribute('disabled'); // Re-enable keys if they were disabled
    });

    // Hide game-over messages, hints, and any other end-game elements
    const endGameElements = ['.success', '.hint', '.splatter-box', '#word-reveal'];
    endGameElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'none';
            element.style.opacity = '0'; // Assuming CSS transitions, this would start fade-out
        }
    });

    // Optionally, if you have a modal or overlay that shows game stats or messages, hide it
    // const statsModal = document.getElementById('statsModalId'); // Example
    // if (statsModal) statsModal.style.display = 'none';

    // Any other UI reset operations needed
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
    const savedState = JSON.parse(localStorage.getItem('horrordleGameState'));
    const today = getLocalDateISOString();

    if (savedState && savedState.gameDate === today) {
        // Check if the game was completed
        if (savedState.isGameOver) {
            disableInput(); // Ensure no further inputs are possible
            concludeGame(savedState.gameWon); // Display the end-game state correctly
        } else {
            // The game is still in progress
            // Restore the guesses on the board
            savedState.gameGuessLetters.forEach((guessLetters, attempt) => {
                updateTiles(attempt, guessLetters.join(''), savedState.gameGuessColors[attempt]);
            });

            // Restore the keyboard state
            refreshKeyboardState(savedState.gameGuessLetters, savedState.gameGuessColors);
            
            currentAttempt = savedState.gameGuessLetters.length; // Ensure the next guess continues correctly
        }
    } else {
        // No saved state for today, or it's a new day
        startNewGame();
    }
}

function refreshKeyboardState(gameGuessLetters, gameGuessColors) {
    // Flatten the arrays if they're arrays of arrays
    const flatLetters = gameGuessLetters.flat();
    const flatColors = gameGuessColors.flat();

    flatLetters.forEach((letter, index) => {
        const keyElement = document.querySelector(`.key[data-key="${letter.toUpperCase()}"]`);
        if (keyElement) {
            // Remove any previous state classes
            keyElement.classList.remove('correct', 'present', 'absent');
            // Add new state class
            keyElement.classList.add(flatColors[index]);
        }
    });
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
    }, 1200); // Delay of 1200ms
}

function concludeGame(won) {
    isGameOver = true;
    updateStats(won, currentAttempt);
    // Optionally delay the stats modal display if needed
    setTimeout(displayStatsModal, 1200); // Adjust the delay as needed
    saveCurrentGameState(won); // Pass 'won' to indicate game outcome

    // Additional UI updates, such as revealing the word of the day on game loss, can be handled here
    if (!won) {
        revealWordOfTheDay(); // Existing function to make adjustments for game loss

        // Reveal the word of the day
        const wordRevealDiv = document.getElementById('word-reveal');
        const wordContent = document.getElementById('word-content'); // Assuming this is where the word of the day is displayed within #word-reveal
        if (wordRevealDiv && wordContent) {
            wordContent.textContent = wordOfTheDay; // Update the text content to the word of the day
            wordRevealDiv.style.display = 'flex'; // Make the div visible
            setTimeout(() => {
                wordRevealDiv.style.opacity = 1; // Fade in if you have CSS transitions set up
            }, 100); // Adjust timing as needed
        }
    }

    // Trigger any additional endgame UI updates
    showEndGameMessage(won);
    saveCurrentGameState(won);

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
    return `Horrordle.app, ${date}\n\n${resultString}`;
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

function enableInput() {
    document.getElementById('keyboard').style.pointerEvents = 'auto'; // Re-enables click events on the on-screen keyboard
    inputDisabled = false; // Update the global flag controlling input, if you have one.
}

function disableInput() {
    document.getElementById('keyboard').style.pointerEvents = 'none'; // Disables click events on the on-screen keyboard
    inputDisabled = true; // Update the global flag controlling input, if you have one.
}

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