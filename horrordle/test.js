class HorrordleGame {
  constructor() {
    this.wordOfTheDay = '';
    this.dictionary = [];
    this.currentAttempt = 0;
    this.maxAttempts = 6;
    this.isGameOver = false;
    this.incorrectGuesses = 0;
    this.hintDisplayed = false;
    this.hintOfTheDay = '';
    this.gameGuessColors = [];
    this.gameGuessLetters = [];
    this.currentGuess = [];
    this.inputDisabled = false;
    
    this.loadGame();
    this.setupEventListeners();
  }

  async loadGame() {
    try {
      const dictionaryResponse = await fetch('https://jonwcole.github.io/horrordle/dictionary.json');
      const dictionaryData = await dictionaryResponse.json();
      this.dictionary = dictionaryData.map(word => word.toUpperCase());

      const wordsResponse = await fetch('https://jonwcole.github.io/horrordle/words.json');
      const wordsData = await wordsResponse.json();
      const today = new Date().toISOString().slice(0, 10);
      const wordData = wordsData[today];

      if (wordData) {
        this.wordOfTheDay = wordData.word.toUpperCase();
        this.hintOfTheDay = wordData.hint;
        localStorage.setItem('gameDate', today);
        document.getElementById('hint').textContent = this.hintOfTheDay;
        document.getElementById('word-content').textContent = this.wordOfTheDay;
      } else {
        console.error('Word for today not found');
      }
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  }

  setupEventListeners() {
    document.getElementById('keyboard').addEventListener('click', e => this.handleKeyboardClick(e));
    document.addEventListener('keydown', e => this.handleKeyPress(e));
    document.getElementById('share-result').addEventListener('click', () => this.shareResults());
  }

  handleKeyboardClick(e) {
    if (e.target.matches('.key')) {
      const key = e.target.getAttribute('data-key');
      this.processKey(key);
    }
  }

  handleKeyPress(e) {
    if (this.inputDisabled) return;
    
    if (e.key === 'Enter') {
      this.submitGuess();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.deleteLastCharacter();
    } else {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/i.test(key)) {
        this.processKey(key);
      }
    }
  }

  processKey(key) {
    if (this.isGameOver || this.inputDisabled) return;

    switch (key) {
      case 'ENTER':
        this.submitGuess();
        break;
      case 'BACKSPACE':
        this.deleteLastCharacter();
        this.updateCurrentGuessDisplay();
        break;
      default:
        if (/^[A-Z]$/i.test(key) && this.currentGuess.length < 5) {
          this.currentGuess.push(key);
          this.updateCurrentGuessDisplay();
        }
    }
  }

  submitGuess() {
    // Ensure we can submit guesses
    if (this.isGameOver || this.currentGuess.length < 5) return;

    const guess = this.currentGuess.join('').toUpperCase();

    // Validate guess is in dictionary
    if (!this.dictionary.includes(guess)) {
      this.shakeCurrentRow();
      return; // Invalid guess, so exit early
    }

    // Check if guess matches the word of the day
    const isCorrect = guess === this.wordOfTheDay;
    if (isCorrect) {
      this.isGameOver = true; // Mark game as won
    } else {
      this.incorrectGuesses++; // Increment for hint display logic
      if (this.currentAttempt + 1 >= this.maxAttempts) {
        this.isGameOver = true; // No more attempts left
      }
    }

    // Process guess for feedback
    this.processGuess(guess);

    // Prepare for next guess or conclude game
    if (!this.isGameOver) {
      this.currentAttempt++;
      this.currentGuess = []; // Reset for next guess
    } else {
      // Display end-game message
      this.displayEndGameMessage(isCorrect);
    }

    // Always update display regardless of guess outcome
    this.updateCurrentGuessDisplay();
  }

  shakeCurrentRow() {
    // Select the current row based on the current attempt
    const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${this.currentAttempt}"]`);
    if (currentRow) {
      currentRow.classList.add('shake');

      // Remove the shake class after the animation duration to reset the state
      setTimeout(() => {
        currentRow.classList.remove('shake');
      }, 800); // Assuming 800ms is the CSS animation duration for the shake effect
    } else {
      console.error('Current row not found for shaking:', this.currentAttempt);
    }
  }

  processGuess(guess) {
    // Initialize arrays to store the results of each letter comparison
    let result = new Array(guess.length).fill('absent');
    let wordOfTheDayArray = this.wordOfTheDay.split('');

    // First pass: Check for correct letters in the correct position
    guess.split('').forEach((letter, index) => {
      if (letter === wordOfTheDayArray[index]) {
        result[index] = 'correct';
        wordOfTheDayArray[index] = null; // Mark this letter as "used"
      }
    });

    // Second pass: Check for correct letters in the wrong position
    guess.split('').forEach((letter, index) => {
      if (wordOfTheDayArray.includes(letter) && result[index] !== 'correct') {
        result[index] = 'present';
        wordOfTheDayArray[wordOfTheDayArray.indexOf(letter)] = null; // Mark this letter as "used"
      }
    });

    // Update the game state with the results of this guess
    this.gameGuessColors.push(result);
    this.gameGuessLetters.push(guess.split(''));

    // Update UI based on the results
    this.updateTiles(this.currentAttempt, guess, result);

    // Save game state to local storage
    this.saveGameState();

    // Check for game end conditions
    if (guess === this.wordOfTheDay) {
      this.isGameOver = true;
      this.displayEndGameMessage(true);
    } else if (this.currentAttempt >= this.maxAttempts - 1) {
      this.isGameOver = true;
      this.displayEndGameMessage(false);
    }
  }

  displayEndGameMessage(isCorrect) {
    // Select the elements for displaying the end game message
    const successMessage = document.querySelector('.success');
    const failureMessage = document.querySelector('.failure');
    const hintElement = document.querySelector('.hint');

    // Display the hint if it hasn't been shown yet
    if (!this.hintDisplayed) {
      this.displayHint();
    }

    if (isCorrect) {
      // Display the success message
      successMessage.style.display = 'block';
      setTimeout(() => successMessage.style.opacity = 1, 10); // Start the fade-in effect
    } else {
      // Display the failure message and the correct word
      failureMessage.style.display = 'block';
      setTimeout(() => failureMessage.style.opacity = 1, 10); // Start the fade-in effect
      
      // Also reveal the word of the day
      const wordElement = document.getElementById('word');
      const wordContentElement = document.getElementById('word-content');
      wordContentElement.textContent = this.wordOfTheDay; // Update with the correct word
      wordElement.style.display = 'flex';
      setTimeout(() => wordElement.style.opacity = 1, 100); // Fade in the word reveal
    }

    // Handle additional UI updates or actions that should occur at the end of the game
    // For example, disabling further input or highlighting the stats button
    this.disableInput();

    // Optionally, trigger the display of stats or share results
    // this.displayStatsModal(); // Uncomment if you want to show stats automatically
  }

  deleteLastCharacter() {
    // Check if there's at least one character to remove
    if (this.currentGuess.length > 0) {
      // Remove the last character from the current guess
      this.currentGuess.pop();
      // Update the display to reflect the change
      this.updateCurrentGuessDisplay();
    }
  }

  updateCurrentGuessDisplay() {
    // Assume the current attempt corresponds to a row of tiles in the UI
    const currentRowTiles = document.querySelectorAll(`.tile-row-wrapper[data-attempt="${this.currentAttempt}"] .tile`);
    
    // Clear all tiles in the current row first
    currentRowTiles.forEach(tile => {
      tile.querySelector('.front').textContent = '';
    });
    
    // Set the tiles based on the current guess' letters
    this.currentGuess.forEach((letter, index) => {
      const tileFront = currentRowTiles[index].querySelector('.front');
      tileFront.textContent = letter;
    });
  }

  generateResultString() {
    const emojiMap = {
      correct: '🟩',
      present: '🟨',
      absent: '⬛'
    };
    let resultString = 'Horrordle Result:\n\n';
    this.gameGuessColors.forEach(guess => {
      const guessString = guess.map(status => emojiMap[status]).join('');
      resultString += `${guessString}\n`;
    });
    return resultString.trim();
  }

  saveGameState() {
    // Save the current game's progress and outcomes
    localStorage.setItem('currentAttempt', JSON.stringify(this.currentAttempt));
    localStorage.setItem('gameGuessColors', JSON.stringify(this.gameGuessColors));
    localStorage.setItem('gameGuessLetters', JSON.stringify(this.gameGuessLetters));
    localStorage.setItem('isGameOver', JSON.stringify(this.isGameOver));
    localStorage.setItem('hintDisplayed', JSON.stringify(this.hintDisplayed));

    // Assuming you have a method or properties to calculate these stats, save them as well
    localStorage.setItem('stats', JSON.stringify({
      gamesPlayed: this.stats.gamesPlayed,
      wins: this.stats.wins,
      currentStreak: this.stats.currentStreak,
      maxStreak: this.stats.maxStreak,
      // Add other statistics as necessary
    }));

    // Save the outcome of the last game (won or lost)
    localStorage.setItem('gameOutcome', this.isGameOver && this.currentAttempt < this.maxAttempts ? 'won' : 'lost');

    // Note: This implementation assumes you have a `stats` object in your class for tracking game statistics.
  }

  displayStats() {
    // Example stats structure (ensure your class initializes this correctly)
    // this.stats = { gamesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0, guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0} };

    // Calculate win percentage
    const winPercentage = this.stats.gamesPlayed > 0 ? Math.round((this.stats.wins / this.stats.gamesPlayed) * 100) : 0;

    // Update the UI with the calculated stats
    document.getElementById('games-played').textContent = this.stats.gamesPlayed;
    document.getElementById('win-percentage').textContent = `${winPercentage}%`;
    document.getElementById('current-streak').textContent = this.stats.currentStreak;
    document.getElementById('max-streak').textContent = this.stats.maxStreak;

    // If you're displaying guess distribution or other stats, update those elements similarly
    Object.entries(this.stats.guessDistribution).forEach(([guess, count]) => {
      const distributionElement = document.getElementById(`distribution-${guess}`);
      if (distributionElement) {
        // Update distribution display, e.g., setting width of a bar in a bar chart, or simply updating text content
        distributionElement.textContent = count; // Simplified example
      }
    });

    // Optionally, handle visibility or styling changes for the stats display area
  }

  startNewGame() {
    // Reset game state properties
    this.wordOfTheDay = '';
    this.currentAttempt = 0;
    this.isGameOver = false;
    this.incorrectGuesses = 0;
    this.hintDisplayed = false;
    this.gameGuessColors = [];
    this.gameGuessLetters = [];
    this.currentGuess = [];
    this.inputDisabled = false;

    // Optionally, clear any game-specific UI elements or messages
    document.querySelector('.success').style.display = 'none';
    document.querySelector('.failure').style.display = 'none';
    document.getElementById('hint').style.display = 'none';
    document.getElementById('word-content').textContent = ''; // Clear the word of the day reveal

    // Clear the game board for a new game
    this.clearGameBoard();

    // Load a new game
    this.loadGame();
  }

  clearGameBoard() {
    // Clear the tiles for a new game
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
      tile.querySelector('.front').textContent = '';
      tile.querySelector('.back').textContent = '';
      tile.classList.remove('correct', 'present', 'absent', 'flipped');
    });

    // Reset any other UI elements specific to your game board
  }

disableInput() {
  // Flag to disable processing of key inputs
  this.inputDisabled = true;

  // Optionally, visually indicate that the input is disabled (e.g., by dimming or hiding the virtual keyboard)
  const keyboard = document.getElementById('keyboard');
  if (keyboard) {
    keyboard.classList.add('disabled'); // Assuming 'disabled' class dims or hides the element
  }

  // Disable individual keys on the virtual keyboard as needed
  const keys = document.querySelectorAll('.key');
  keys.forEach(key => {
    key.setAttribute('disabled', true);
    key.classList.add('key-disabled'); // Assuming 'key-disabled' visually indicates the key is disabled
  });

  // Note: This example assumes you have a CSS class named 'disabled' that styles the keyboard
  // or keys as disabled (e.g., reducing opacity, adding a 'not-allowed' cursor, etc.)
}

  displayHint() {
    const hintElement = document.getElementById('hint');
    if (hintElement && !this.hintDisplayed) {
      hintElement.textContent = this.hintOfTheDay;
      hintElement.style.display = 'block';
      setTimeout(() => hintElement.style.opacity = 1, 10); // Assuming CSS handles the transition
      this.hintDisplayed = true;
    }
  }

  updateTiles(attempt, guess, result) {
    // Select the row for the current attempt
    const currentRowTiles = document.querySelectorAll(`.tile-row-wrapper[data-attempt="${attempt}"] .tile`);
    
    // Ensure there's a tile for each letter in the guess
    currentRowTiles.forEach((tile, index) => {
      // Assuming the result array contains values like 'correct', 'present', 'absent' for each letter
      const status = result[index];

      // Update the front and back of each tile with the guess letter and color based on the result
      const front = tile.querySelector('.front');
      const back = tile.querySelector('.back');

      front.textContent = guess[index]; // Show the letter on the tile
      back.textContent = guess[index]; // Optionally, also set the letter on the back for a flip animation

      // Reset any previous classes (if the game is being replayed without page reload)
      back.classList.remove('correct', 'present', 'absent');
      
      // Apply the class based on the result for this letter
      back.classList.add(status);

      // Trigger the flip animation after a short delay to visualize the checking process
      setTimeout(() => tile.classList.add('flipped'), index * 150); // Adjust timing as needed
    });
  }

}

// Instantiate the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => new HorrordleGame());
