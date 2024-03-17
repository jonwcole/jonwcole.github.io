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
  // Implement this function to reflect the current guess on the game board
  // For example, updating the tiles to show the letters in `currentGuess`
  const tiles = document.querySelectorAll('.tile');
  // Reset/clear any existing letters on the board in the current row
  tiles.forEach((tile, index) => {
    if (Math.floor(index / 5) === currentAttempt) { // Check if the tile is in the current row
      tile.textContent = currentGuess[index % 5] || ''; // Update tile content
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
  // This function should compare the guess to the word of the day
  // and update the game board accordingly.
  // Implement logic here for marking tiles as correct, present, or absent.
}

function deleteLastCharacter() {
  // Check if there's at least one character to remove
  if (currentGuess.length > 0) {
    currentGuess.pop(); // Remove the last letter from the current guess
    updateCurrentGuessDisplay(); // Update the display accordingly
  }
}

document.addEventListener('DOMContentLoaded', loadGame); // This is correctly closed