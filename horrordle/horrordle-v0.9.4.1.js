// v0.9.4.03 //

// ================================== //
// 1. Initialization and Data Loading //
// ================================== //

let wordOfTheDay = '';
let dictionary = [];
let gameDate = ''; // Ensure this is declared globally for use in stats
let hintOfTheDay = '';

async function loadGame() {
    try {
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const adjustedNow = new Date(now.getTime() - timezoneOffset);
        const today = adjustedNow.toISOString().slice(0, 10);

        // Check if today's date is the same as the stored game date
        const storedGameDate = localStorage.getItem('gameDate');
        if (storedGameDate !== today) {
            // Reset game-specific data for a new day
            gameGuessColors = [];
            gameGuessLetters = [];
            localStorage.removeItem('gameGuessColors');
            localStorage.removeItem('gameGuessLetters');
            localStorage.removeItem('incorrectGuesses'); // Resetting incorrect guesses count
        }

        // Fetch and set up the dictionary
        const dictionaryResponse = await fetch('https://jonwcole.github.io/horrordle/dictionary-v1.1.json');
        const dictionaryData = await dictionaryResponse.json();
        dictionary = dictionaryData.map(word => word.toUpperCase());

        // Fetch and set up the word of the day
        const wordsResponse = await fetch('https://jonwcole.github.io/horrordle/words-v1.2.json');
        const wordsData = await wordsResponse.json();
        
        const wordData = wordsData[today];
        if (wordData) {
            // Set up the game with the word of the day, hint, and context if available
            wordOfTheDay = wordData.word.toUpperCase();
            hintOfTheDay = wordData.hint;
            const contextOfTheDay = wordData.context || '';
            gameDate = today;

            localStorage.setItem('gameDate', gameDate);

            // Update the UI to reflect the new game state
            updateGameUI(wordOfTheDay, hintOfTheDay, contextOfTheDay);
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
    if (isRevealingGuess || isGameOver || currentGuess.length !== 5) return;

    isRevealingGuess = true;
    const guess = currentGuess.join('').toUpperCase();

    if (!dictionary.includes(guess)) {
        shakeCurrentRow();
        isRevealingGuess = false;
        return;
    }

    if (guess !== wordOfTheDay) {
        incorrectGuesses++;
        localStorage.setItem('incorrectGuesses', incorrectGuesses); // Save the updated count
    }

    processGuess(guess);

    setTimeout(() => {
        if (incorrectGuesses >= 5) {
            if (!hintDisplayed) {
                displayHint();
                hintDisplayed = true;
            }
            if (incorrectGuesses >= 6) {
                isGameOver = true;
                revealWordOfTheDay();
                concludeGame(false);
            }
        }

        if (!isGameOver) {
            handleGuessFinalization(guess);
            isRevealingGuess = false;
        }
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

    saveGuessesToLocalStorage(); // Save after every guess

    currentAttempt++; 
    saveGameProgress(guess, result);
    if (currentAttempt >= maxAttempts || guess === wordOfTheDay) {
        isGameOver = true;
        concludeGame(guess === wordOfTheDay);
    }
}

function handleGuessFinalization(guess) {
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
    let allCorrect = result.every(status => status === 'correct'); // Check if all tiles are correct

    tiles.forEach((tile, index) => {
        // Set up the back face with the guessed letter and status class before starting the animation
        const back = tile.querySelector('.back');
        const backText = tile.querySelector('.back-text');
        backText.textContent = guess[index];
        back.className = 'back'; // Reset any previous result classes
        back.classList.add(result[index]);

        // Delay each tile's flip animation to visualize them one by one
        setTimeout(() => {
            tile.classList.add('flipped');

            // If the guess is entirely correct, trigger the win animation for each tile after all have been revealed
            if (allCorrect && index === tiles.length - 1) {
                // Start celebration animation 500ms after the last tile has flipped
                setTimeout(() => {
                    tiles.forEach((celebrationTile, celebrationIndex) => {
                        setTimeout(() => {
                            celebrationTile.classList.add('tile-win-pop'); // Apply win animation class
                        }, 100 * celebrationIndex); // Stagger each win animation by 100ms
                    });
                }, 500);
            }
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
    revealWordOfTheDay(); // Handle revealing the word for both winning and losing cases

    // Update the result text based on the game outcome
    const resultTextElement = document.getElementById('result-text');
    if (resultTextElement) {
        if (won) {
            resultTextElement.textContent = 'won'; // Set text to 'won' if the user wins
        } else {
            resultTextElement.textContent = 'lost'; // Optionally set text to 'lost' if the user loses
        }
    }

    // Display splatter boxes and simulate stats modal click after a delay
    document.querySelectorAll('.splatter-box').forEach(box => {
        box.style.display = 'block';
        setTimeout(() => box.style.opacity = '1', 10);
    });

    setTimeout(() => {
        const navButton = document.querySelector('.nav-button-default-state');
        if (navButton) {
            navButton.click();  // Simulate click to open stats modal
        }
    }, 3500);
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
    const gameProgress = JSON.parse(localStorage.getItem('gameProgress'));
    const today = getLocalDateISOString(new Date());

    if (gameProgress && gameProgress.date === today) {
        gameGuessColors = JSON.parse(localStorage.getItem('gameGuessColors')) || [];
        gameGuessLetters = JSON.parse(localStorage.getItem('gameGuessLetters')) || [];
        incorrectGuesses = parseInt(localStorage.getItem('incorrectGuesses')) || 0; // Ensure incorrect guesses are restored
        currentAttempt = gameProgress.attempts.length;
        isGameOver = gameProgress.gameEnded;

        let cumulativeResults = {}; // Initialize an object to hold final state of each letter

        gameProgress.attempts.forEach((attemptObj, attempt) => {
            restoreAttempt(attemptObj, attempt, cumulativeResults);
        });

        updateKeyboardState(cumulativeResults); // Update the keyboard after all attempts have been processed

        if (incorrectGuesses >= 5) {
            displayHint(); // Display the hint if there were 5 or more incorrect guesses
            hintDisplayed = true; // Prevent hint from being shown again
        }

        if (isGameOver) {
            disableInput();
            displayCompletedMessage();  // Display the completed message if the game is over
            if (currentAttempt >= maxAttempts) {
                revealWordOfTheDay(); // Immediate reveal if resuming at max attempts
            }
            displayEndGameState();
        }
    }
}

function displayCompletedMessage() {
    const completedMessageElement = document.getElementById('completed-message');
    if (completedMessageElement) {
        completedMessageElement.style.display = 'block'; // Show the completed message
    }
}

function restoreAttempt(attemptObj, attempt, cumulativeResults) {
    const row = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
    const tiles = row.querySelectorAll('.tile');
    attemptObj.guess.split('').forEach((letter, index) => {
        const tile = tiles[index];
        const front = tile.querySelector('.front');
        const back = tile.querySelector('.back');
        const backText = tile.querySelector('.back-text');
        front.textContent = letter;
        backText.textContent = letter;
        back.className = 'back ' + attemptObj.result[index];
        tile.classList.add('flipped');

        // Determine the most relevant result for each letter for the keyboard
        const result = attemptObj.result[index];
        if (!cumulativeResults[letter] || result === 'correct' || (result === 'present' && cumulativeResults[letter] !== 'correct')) {
            cumulativeResults[letter] = result;
        }
    });
}

function displayEndGameState() {
    const wordElement = document.getElementById('word-reveal');
    const wordContent = document.getElementById('word-content');
    const splatterBoxes = document.querySelectorAll('.splatter-box');
    
    if (wordElement && wordContent) {
        wordContent.textContent = wordOfTheDay;
        wordElement.style.display = 'flex';
        setTimeout(() => wordElement.style.opacity = 1, 100);
    }
    
    splatterBoxes.forEach(box => {
        box.style.display = 'block';
        box.style.opacity = '1';
    });

    displayStatsModal(); // Show stats modal if it's part of the UI
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
    }, 3500); // Delay of 1200ms
}

function concludeGame(won) {
    let gameProgress = JSON.parse(localStorage.getItem('gameProgress') || '{}');
    if (!gameProgress.gameEnded) {  // Check if the game has already been concluded to prevent double counting
        gameProgress.gameEnded = true;
        localStorage.setItem('gameProgress', JSON.stringify(gameProgress));

        updateStats(won, currentAttempt); // Update game statistics

        // Calculate the total delay needed for all tiles to flip before showing the end game UI
        let totalFlipDelay = (currentGuess.length * 500) + 600;  // Adjust based on your tile flip timing

        // Display end game message and stats modal after all tiles have flipped
        setTimeout(() => {
            displayEndGameMessage(won); // Handle UI updates for winning or losing
            displayCompletedMessage(); // Show completed game message if it's a new game day
            displayStatsModal(); // Show stats modal last
        }, totalFlipDelay);
    }
}



// ==================== //
// 7. Utility Functions //
// ==================== //

function generateResultString() {
    const gameProgress = JSON.parse(localStorage.getItem('gameProgress') || '{}');
    const storedDate = gameProgress.date; // Retrieve the date directly as stored

    // Format the date from "YYYY-MM-DD" to "M/D"
    const dateParts = storedDate.split('-'); // Split the date into components
    const month = parseInt(dateParts[1], 10); // Convert the month part to integer and remove leading zeros
    const day = parseInt(dateParts[2], 10); // Convert the day part to integer and remove leading zeros
    const formattedDate = `${month}/${day}`; // Construct the new date format

    const storedGuesses = JSON.parse(localStorage.getItem('gameGuessColors') || '[]');
    const emojiMap = {
        'absent': '⬛',
        'present': '🟨',
        'correct': '🟥'
    };

    // Build the result string for each guess
    const resultString = storedGuesses.map(guess =>
        guess.map(status => emojiMap[status]).join('')
    ).join('\n');

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

function disableInput() {
    // Here you should disable the keyboard and any other input forms you have.
    // This could be as simple as not allowing key presses to register or hiding the virtual keyboard if you have one.
    // Example:
    document.getElementById('keyboard').style.pointerEvents = 'none'; // Disables click events on the on-screen keyboard
    // You might also disable physical keyboard input by removing or disabling event listeners.
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
