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

  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(now.getTime() - timezoneOffset);
  const today = adjustedDate.toISOString().slice(0, 10);

  fetch('https://jonwcole.github.io/horrordle/words.json')
    .then(response => response.json())
    .then(data => {
      const todayData = data[today];
      if (todayData) {
        wordOfTheDay = todayData.word.toUpperCase();
        hintOfTheDay = todayData.hint;
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
    
    // Check if the guess is incorrect
    if (guess !== wordOfTheDay) {
        incorrectGuesses++; // Increment for any incorrect guess, regardless of being in the dictionary
        
        // Immediately show the hint if the threshold is met, no need to wait until the end of the function
        if (incorrectGuesses >= 5) {
            displayHint(); // Show hint function
        }
    }

    // Check if the guessed word is not in the dictionary
    if (!dictionary.includes(guess)) {
        // Trigger the shake effect for an invalid guess
        const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${currentAttempt}"]`);
        if (currentRow) {
            currentRow.classList.add('shake');
            setTimeout(() => {
                currentRow.classList.remove('shake');
            }, 800);
        }
        return; // Do not proceed further if the guess is not in the dictionary
    }
  
    processGuess(guess); // Continue with processing the guess

  // Delay to account for letter flipping animation
  setTimeout(() => {
    currentAttempt++;
    currentGuess = [];

    if (guess === wordOfTheDay || currentAttempt >= maxAttempts) {
      isGameOver = true;
      updateStats(guess === wordOfTheDay, currentAttempt);

      // Delay for the flip animations plus an additional time for showing the hint if needed
      let delayTime = currentGuess.length * 500 + (hintDisplayed ? 600 : 0);
      
      setTimeout(() => {
        const messageDiv = guess === wordOfTheDay ? document.querySelector('.success') : document.querySelector('.failure');
        messageDiv.style.display = 'block';
        setTimeout(() => {
          messageDiv.style.opacity = 1;
          setTimeout(() => {
            // After showing the message, proceed to display stats
            messageDiv.style.opacity = 0;
            setTimeout(() => {
              messageDiv.style.display = 'none';
              const statsDiv = document.querySelector('.stats');
              statsDiv.style.display = 'flex';
              setTimeout(() => statsDiv.style.opacity = 1, 100);
            }, 600); // Pause after showing the message
          }, 1200); // Time for the message to fade in
        }, 100); // Allow time for display: block to take effect before starting opacity transition
      }, delayTime); // Wait for tiles to flip and hint to be shown if applicable
    }

  }, currentGuess.length * 500 + 600); // Wait for all tiles to flip, then an additional 600ms

  // After processing the guess, check for displaying the hint
  if (incorrectGuesses >= 5) {
    displayHint();
  }
}

function displayHint() {
  const hintElement = document.getElementById('hint');
  if (hintElement && !hintDisplayed && hintOfTheDay) {
    hintElement.textContent = hintOfTheDay; // Set the hint text
    hintElement.style.display = 'block'; // Make the element layout-visible

    // Force a reflow to ensure the transition is triggered
    void hintElement.offsetWidth;

    // Now start the fade-in
    hintElement.style.opacity = 1;

    hintDisplayed = true; // Prevent re-displaying the hint
  }
}


function showStatsAfterDelay() {
  // Wait 3 seconds before showing stats and hiding success/failure message
  setTimeout(() => {
    document.querySelector('.stats').style.display = 'flex';
    document.querySelectorAll('.success, .failure').forEach(el => el.style.display = 'none');
    // Optionally, refresh the stats display if needed
    displayStats();
  }, 3000);
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
  const today = new Date().toISOString().slice(0, 10); // Get the current date in YYYY-MM-DD format

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
  stats.lastPlayedDate = today; // Update the lastPlayedDate with the current date
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

function restoreGameStateIfPlayedToday() {
    const stats = JSON.parse(localStorage.getItem('stats')) || {};
    const today = new Date().toISOString().slice(0, 10);

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
                const tile = tiles[index];
                const front = tile.querySelector('.front');
                const back = tile.querySelector('.back');

                front.textContent = letter;
                back.textContent = letter;
                back.classList.add(gameGuessColors[attempt][index]); // Assuming gameGuessColors mirrors the structure of gameGuessLetters

                // Add the flipped class to the tile for the flipping effect
                tile.classList.add('flipped');
            });
        });

        // Display stats modal
        document.querySelector('.stats').style.display = 'flex';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadGame(); // Make sure this still runs to load the game data
    restoreGameStateIfPlayedToday(); // Check if we need to restore state
});