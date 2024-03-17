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
      dictionary = data.words.map(word => word.toUpperCase()); // Assuming your dictionary structure has a 'words' array
    })
    .catch(error => console.error('Error loading dictionary:', error));

  // Fetching the word of the day
  const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
  fetch('https://jonwcole.github.io/horwordle/words.json')
    .then(response => response.json())
    .then(data => {
      wordOfTheDay = data[today].toUpperCase(); // Assuming your words.json is an object with dates as keys
    })
    .catch(error => console.error('Error loading word of the day:', error));
}

document.addEventListener('DOMContentLoaded', loadGame);