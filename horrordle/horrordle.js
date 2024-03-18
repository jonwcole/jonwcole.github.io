let wordOfTheDay = '';
let dictionary = [];
let guesses = [];
let currentAttempt = 0;
let maxAttempts = 6;
let isGameOver = false;

function loadGame() {
  // Fetching the dictionary
  fetch('https://jonwcole.github.io/horrordle/dictionary.json')
    .then(response => response.json())
    .then(data => {
      dictionary = data.map(word => word.toUpperCase());
    })
    .catch(error => console.error('Error loading dictionary:', error));

  // Adjusting for timezone offset
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000; // Convert offset to milliseconds
  const adjustedDate = new Date(now - timezoneOffset);
  const today = adjustedDate.toISOString().slice(0, 10);

  // Fetching the word of the day using the adjusted date
  fetch('https://jonwcole.github.io/horrordle/words.json')
    .then(response => response.json())
    .then(data => {
      wordOfTheDay = data[today]?.toUpperCase(); // Access the word directly using the date key
      if (!wordOfTheDay) {
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

function handleKeyPress(key) {
  // Check if game is over
  if (isGameOver) return;

  // If the key is a valid letter and the current guess is less than the max word length
  if (/^[A-Z]$/i.test(key) && currentGuess.length < 5) {
    currentGuess.push(key.toUpperCase()); // Add the uppercase letter to the current guess
    updateCurrentGuessDisplay(); // Function to visually update the guess on the game board
  }
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
  if (isGameOver || currentGuess.length < 5) return; // Ensure the game is not over and the guess is complete

  const guess = currentGuess.join('').toUpperCase(); // Combine the letters to form the guess word
  if (!dictionary.includes(guess)) {
    console.log("Not in word list"); // Use a UI element to display this message as needed
    return;
  }

  processGuess(guess);

  currentAttempt++; // Move to the next attempt
  currentGuess = []; // Reset the current guess for the next attempt

  // Check for game end conditions after a slight delay to allow for animations
  setTimeout(() => {
    if (guess === wordOfTheDay) {
      // Game won
      document.querySelector('.success').style.display = 'block';
      updateStats(true, currentAttempt);
      isGameOver = true;
      showStatsAfterDelay();
    } else if (currentAttempt >= maxAttempts) {
      // Game lost
      document.querySelector('.failure').style.display = 'block';
      updateStats(false, 0); // Indicates a loss
      isGameOver = true;
      showStatsAfterDelay();
    }
    // If the game is not over, simply proceed without showing any messages
  }, currentGuess.length * 500); // Adjust this delay to match your flipping animation time
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
  let wordArray = wordOfTheDay.split(''); // Convert word of the day into an array for easy manipulation
  let result = []; // Array to hold the result (correct, present, absent) for each letter

  // First pass: Check for correct letters (right letter, right position)
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === wordOfTheDay[i]) {
      result[i] = 'correct';
      wordArray[i] = null; // Mark this letter as used
    } else {
      result[i] = 'absent'; // Default to absent, will check for 'present' in next pass
    }
  }

  // Second pass: Check for present letters (right letter, wrong position)
  for (let i = 0; i < guess.length; i++) {
    if (result[i] !== 'correct' && wordArray.includes(guess[i])) {
      result[i] = 'present';
      wordArray[wordArray.indexOf(guess[i])] = null; // Mark this letter as used
    }
  }

  // Update the UI based on the result for each letter in the guess
  updateTiles(currentAttempt, guess, result);
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
  // This function should update the on-screen keyboard based on the result
  // Example: If a letter is 'correct', the corresponding key could be marked green
  guess.split('').forEach((letter, index) => {
    const key = document.querySelector(`.key[data-key='${letter}']`); // Assuming keys have a data-key attribute
    if (result[index] === 'correct') {
      key.classList.add('correct');
    } else if (result[index] === 'present') {
      // Only add 'present' if not already marked 'correct'
      if (!key.classList.contains('correct')) {
        key.classList.add('present');
      }
    } else {
      // Only add 'absent' if not marked 'correct' or 'present'
      if (!key.classList.contains('correct') && !key.classList.contains('present')) {
        key.classList.add('absent');
      }
    }
  });
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

displayStats(); // Call this function to update the UI with the latest stats

function resetStats() {
  saveStats(defaultStats);
  displayStats(); // Refresh the stats display
}

document.addEventListener('DOMContentLoaded', loadGame); // This is correctly closed