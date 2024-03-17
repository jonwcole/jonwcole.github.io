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
    deleteLastCharacter();
  } else {
    const key = e.key.toUpperCase();
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      handleKeyPress(key);
    }
  }
});

function handleKeyPress(key) {
  // Implement logic to handle key press, updating the current guess, etc.
}

function submitGuess() {
  // Implement logic to submit the current guess
}

function deleteLastCharacter() {
  // Implement logic to delete the last character of the current guess
}

document.addEventListener('DOMContentLoaded', loadGame); // This is correctly closed