let wordOfTheDay = '';
let dictionary = [];
let guesses = [];
let currentAttempt = 0;
let maxAttempts = 6;
let isGameOver = false;

function loadGame() {
  // Fetching the dictionary
  fetch('https://jonwcole.github.io/horwordle/dictionary.json')
    .then(response => response.json())
    .then(data => {
      dictionary = data.map(word => word.toUpperCase());
    })
    .catch(error => console.error('Error loading dictionary:', error));

// Fetching the word of the day
const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
fetch('https://jonwcole.github.io/horwordle/words.json')
  .then(response => response.json())
  .then(data => {
    wordOfTheDay = data[today]?.toUpperCase(); // Access the word directly using the date key
    if (!wordOfTheDay) {
      console.error('Word for today not found');
    }
  })
  .catch(error => console.error('Error loading word of the day:', error));
};

// Handling virtual keyboard clicks
document.getElementById('keyboard').addEventListener('click', function(e) {
  if (e.target.matches('.key')) {
    const key = e.target.getAttribute('data-key') || e.target.innerText;
    handleKeyPress(key);
  }
}); // This anonymous function is correctly closed

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
    alert("Not in word list"); // Provide feedback for invalid guesses
    return;
  }

  processGuess(guess); // Compare the guess against the word of the day

  currentAttempt++; // Move to the next attempt
  currentGuess = []; // Reset the current guess for the next attempt

  if (guess === wordOfTheDay) {
    alert("Congratulations, you've guessed the word!");
    isGameOver = true;
    return;
  }

  if (currentAttempt >= maxAttempts) {
    alert(`Game over! The word was: ${wordOfTheDay}`);
    isGameOver = true;
  }

  // Optionally, update the display to reflect the new game state here
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

document.addEventListener('DOMContentLoaded', loadGame); // This is correctly closed

console.log(document.querySelector('.tile .front').textContent); // Check initial content