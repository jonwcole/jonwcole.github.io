let wordOfTheDay = '';
let dictionary = [];
let guesses = [];
let currentAttempt = 0;
let maxAttempts = 6;
let isGameOver = false;
let incorrectGuesses = 0;
let hintDisplayed = false;
let hintOfTheDay = ''; // Make sure this is declared globally
let gameGuessColors = []; // This will store the result colors (correct, present, absent) for each guess.
let gameGuessLetters = []; // This will store the actual letters guessed in each attempt.


function loadGame() {
    fetch('https://jonwcole.github.io/horrordle/dictionary.json')
        .then(response => response.json())
        .then(data => {
            dictionary = data.map(word => word.toUpperCase());
        })
        .catch(error => console.error('Error loading dictionary:', error));

    fetch('https://jonwcole.github.io/horrordle/words.json')
        .then(response => response.json())
        .then(data => {
            const now = new Date();
            const timezoneOffset = now.getTimezoneOffset() * 60000;
            const adjustedNow = new Date(now - timezoneOffset);
            const today = adjustedNow.toISOString().slice(0, 10);

            const wordData = data[today];
            if (wordData) {
                wordOfTheDay = wordData.word.toUpperCase();
                hintOfTheDay = wordData.hint;
                gameDate = today; // Set the game date to today, based on words.json
                localStorage.setItem('gameDate', gameDate); // Store this date in localStorage

                //set the word text
                const wordElement = document.getElementById('word');
                if (wordElement && wordOfTheDay) {
                  wordElement.textContent = wordOfTheDay; // Set the word text
                }

                // Set the hint text early
                const hintElement = document.getElementById('hint');
                if (hintElement && hintOfTheDay) {
                    hintElement.textContent = hintOfTheDay; // Set the hint text
                }
            } else {
                console.error('Word for today not found');
            }
        })
        .catch(error => console.error('Error loading word of the day:', error));
}


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

let currentGuess = []; // An array to hold the current guess's letters

let inputDisabled = false; // flag to control input globally

function handleKeyPress(key) {
  if (isGameOver || inputDisabled) return;

  // If the key is a valid letter and the current guess is less than the max word length
  if (/^[A-Z]$/i.test(key) && currentGuess.length < 5) {
    currentGuess.push(key.toUpperCase()); // Add the uppercase letter to the current guess
    updateCurrentGuessDisplay(); // Function to visually update the guess on the game board
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

function submitGuess() {
    if (isGameOver || currentGuess.length < 5) return;

    const guess = currentGuess.join('').toUpperCase();

    // First, handle the case where the guess is not a valid word
    if (!dictionary.includes(guess)) {
        shakeCurrentRow(); // This will be a new function to handle the shake effect
        return; // Exit the function early as the guess is invalid
    }

    // The guess is valid; check if it's correct
    if (guess !== wordOfTheDay) {
        incorrectGuesses++; // Only increment incorrectGuesses for valid guesses
    }

    processGuess(guess); // Continue with processing the guess

    // Wait for the flip animation to complete before potentially ending the game
    setTimeout(() => {
        handleGuessFinalization(guess); // New function to handle what happens after a guess is processed
    }, currentGuess.length * 500 + 600); // Adjust as necessary
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

function handleGuessFinalization(guess) {
    currentAttempt++;
    currentGuess = [];

    if (guess === wordOfTheDay || currentAttempt >= maxAttempts) {
        isGameOver = true;
        updateStats(guess === wordOfTheDay, currentAttempt);

        // Delay to account for the hint display if needed
        let delayTime = hintDisplayed ? 1200 : 0;
        
        setTimeout(() => {
            displayEndGameMessage(guess === wordOfTheDay);
        }, delayTime);
    }

    // Check if it's time to show the hint (moved from earlier to ensure it's based on valid guesses only)
    if (incorrectGuesses >= 5 && !hintDisplayed) {
        displayHint();
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

function processGuess(guess) {
  let wordArray = wordOfTheDay.split(''); // Existing logic
  let result = []; // Existing logic

  // Your existing logic for determining 'correct', 'present', 'absent'
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

  // After determining the result for each letter, update the UI
  updateTiles(currentAttempt, guess, result);

  // Here's the new part: Add this guess's result to the gameGuessColors array
  gameGuessColors.push(result);

  gameGuessLetters.push(guess.split('')); // Split the guess into individual letters for storage


  // If the game ends (win or lose), save the results to localStorage
  if (currentAttempt >= maxAttempts - 1 || guess === wordOfTheDay) {
    localStorage.setItem('gameGuessColors', JSON.stringify(gameGuessColors));
    localStorage.setItem('gameGuessLetters', JSON.stringify(gameGuessLetters));
  }
}

function saveGuessesToLocalStorage() {
    localStorage.setItem('gameGuessColors', JSON.stringify(gameGuessColors));
    localStorage.setItem('gameGuessLetters', JSON.stringify(gameGuessLetters));
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

function deleteLastCharacter() {
  // Check if there's at least one character to remove
  if (currentGuess.length > 0) {
    currentGuess.pop(); // Remove the last letter from the current guess
    updateCurrentGuessDisplay(); // Update the display accordingly
  }
}

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

  // Use the globally stored gameDate, which corresponds to the date from words.json
  stats.lastPlayedDate = gameDate;
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

function generateResultString() {
    const storedGuesses = JSON.parse(localStorage.getItem('gameGuessColors') || '[]');
    const emojiMap = {
        'absent': '🟫',
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

displayStats(); // Call this function to update the UI with the latest stats

function resetStats() {
  saveStats(defaultStats);
  displayStats(); // Refresh the stats display
}

function startNewGame() {
  incorrectGuesses = 0;
  hintDisplayed = false;
  // Rest of game initialization...
}

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

function restoreGameStateIfPlayedToday() {
    const stats = JSON.parse(localStorage.getItem('stats')) || {};
    const today = getLocalDateISOString(); // Use local date

    if (stats.lastPlayedDate === today) {
        // Prevent further input
        disableInput();

        // Restore game state
        const gameGuessColors = JSON.parse(localStorage.getItem('gameGuessColors') || '[]');
        const gameGuessLetters = JSON.parse(localStorage.getItem('gameGuessLetters') || '[]');

        gameGuessLetters.forEach((guessLetters, attempt) => {
            const row = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
            const tiles = row.querySelectorAll('.tile');

            guessLetters.forEach((letter, index) => {
                if (tiles[index]) {
                    const tile = tiles[index];
                    const front = tile.querySelector('.front');
                    const back = tile.querySelector('.back');

                    // Set the text for front and back
                    front.textContent = letter;
                    back.textContent = letter;
                    
                    // Clear previous classes on back and add the new one
                    back.className = 'back'; // Reset class
                    back.classList.add(gameGuessColors[attempt][index]); // Add correct, present, or absent class
                    
                    // Add the flipped class to the tile for the flipping effect
                    tile.classList.add('flipped');
                }
            });
        });

        // Display stats modal, assuming you have a function or logic to properly display it
        displayStatsModal();
    }
}

function disableInput() {
    // Here you should disable the keyboard and any other input forms you have.
    // This could be as simple as not allowing key presses to register or hiding the virtual keyboard if you have one.
    // Example:
    document.getElementById('keyboard').style.pointerEvents = 'none'; // Disables click events on the on-screen keyboard
    // You might also disable physical keyboard input by removing or disabling event listeners.
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

document.addEventListener('DOMContentLoaded', function() {
    loadGame(); // Make sure this still runs to load the game data
    restoreGameStateIfPlayedToday(); // Check if we need to restore state
});