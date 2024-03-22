// THE GAME MODULE

const Game = (() => {
  // Game state
  let state = {
    wordOfTheDay: '',
    dictionary: [],
    guesses: [],
    currentAttempt: 0,
    maxAttempts: 6,
    isGameOver: false,
    incorrectGuesses: 0,
    hintDisplayed: false,
    hintOfTheDay: '',
    gameGuessColors: [],
    gameGuessLetters: [],
  };

  // Load game setup (moved from global scope)
  const loadGame = () => {
    Promise.all([
      fetch('https://jonwcole.github.io/horrordle/dictionary.json').then(response => response.json()),
      fetch('https://jonwcole.github.io/horrordle/words.json').then(response => response.json())
    ]).then(([dictionaryData, wordsData]) => {
      const now = new Date();
      const timezoneOffset = now.getTimezoneOffset() * 60000;
      const adjustedNow = new Date(now - timezoneOffset);
      const today = adjustedNow.toISOString().slice(0, 10);

      const wordData = wordsData[today];
      if (wordData) {
        state.wordOfTheDay = wordData.word.toUpperCase();
        state.hintOfTheDay = wordData.hint;
        state.dictionary = dictionaryData.map(word => word.toUpperCase());
        // Assume UI is updated elsewhere to reflect these changes
      } else {
        console.error('Word for today not found');
      }
    }).catch(error => {
      console.error('Error loading game data:', error);
    });
  };

  // Submit a guess
  const submitGuess = (guess) => {
    if (state.isGameOver || guess.length < 5 || !state.dictionary.includes(guess)) {
      console.error('Invalid guess');
      return; // Guess is invalid
    }

    // Process guess
    const result = guess.split('').map((char, index) => {
      if (char === state.wordOfTheDay[index]) {
        return 'correct';
      } else if (state.wordOfTheDay.includes(char)) {
        return 'present';
      } else {
        return 'absent';
      }
    });

    state.guesses.push(guess);
    state.gameGuessLetters.push(guess.split(''));
    state.gameGuessColors.push(result);
    state.currentAttempt++;

    // Check for game end
    if (guess === state.wordOfTheDay || state.currentAttempt === state.maxAttempts) {
      state.isGameOver = true;
      // Update UI and storage accordingly
    }

    // Assume other functionalities like updating UI and saving to storage are handled elsewhere
  };


  // Add any additional methods you want as part of the Game module here
  const addCharacterToGuess = (character) => {
    // Logic to add a character to the current guess
    updateCurrentGuessDisplay(); // Reflect this in UI
  };

  const deleteLastCharacter = () => {
    // Logic to remove the last character of the current guess
    updateCurrentGuessDisplay(); // Update UI accordingly
  };

  // Init method for starting or restoring game
  const init = async () => {
    // Load game data and set up initial state
    // Possibly involving fetching data and setting up UI
    return loadGame().then(setupInitialState); // Example promise chain
  };

  // Publicly exposed methods
  return {
    loadGame,
    submitGuess,
    addCharacterToGuess,
    deleteLastCharacter,
    init,
    // Expose additional methods as needed
  };
})();







// THE UI MODULE

const UI = (() => {
  // Update the display with the hint of the day
  const setHint = (hintOfTheDay) => {
    const hintElement = document.getElementById('hint');
    if (hintElement) {
      hintElement.textContent = hintOfTheDay;
      hintElement.style.display = hintOfTheDay ? 'block' : 'none';
    }
  };

  // Refresh the display to show the current guess state
  const updateCurrentGuessDisplay = (currentGuess, currentAttempt) => {
    const rows = document.querySelectorAll('.tile-row-wrapper');
    const currentRow = rows[currentAttempt];
    if (!currentRow) return;

    const tiles = currentRow.querySelectorAll('.tile');
    tiles.forEach((tile, index) => {
      const front = tile.querySelector('.front');
      front.textContent = currentGuess[index] || '';
    });
  };

  // Visual feedback for incorrect guesses
  const shakeCurrentRow = (currentAttempt) => {
    const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${currentAttempt}"]`);
    if (currentRow) {
      currentRow.classList.add('shake');
      setTimeout(() => currentRow.classList.remove('shake'), 800);
    }
  };

  // Update tiles with the result of each guess
  const updateTiles = (attempt, guess, result) => {
    const row = document.querySelector(`#game-board .tile-row-wrapper:nth-child(${attempt + 1})`);
    const tiles = row.querySelectorAll('.tile');
    tiles.forEach((tile, index) => {
      setTimeout(() => {
        const back = tile.querySelector('.back');
        back.textContent = guess[index];
        back.className = 'back ' + result[index];
        tile.classList.add('flipped');
      }, index * 500);
    });
  };

  // Update the on-screen keyboard based on the guess result
  const updateKeyboard = (guess, result) => {
    guess.split('').forEach((letter, index) => {
      const keyElement = document.querySelector(`.key[data-key='${letter.toUpperCase()}']`);
      if (!keyElement) return;
      const className = result[index];
      if (!keyElement.classList.contains(className)) {
        keyElement.classList.add(className);
      }
    });
  };

  // Display end-game message
  const displayEndGameMessage = (won, hintDisplayed) => {
    const message = won ? 'Congratulations! You won!' : 'Try again tomorrow!';
    const messageDiv = document.querySelector(won ? '.success' : '.failure');
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    setTimeout(() => messageDiv.style.opacity = 1, 10);
    
    setTimeout(() => {
      messageDiv.style.opacity = 0;
      setTimeout(() => messageDiv.style.display = 'none', 400);
    }, 2400 + (hintDisplayed ? 1200 : 0));
  };

  // Display stats
  const displayStats = (stats) => {
    // Implementation omitted for brevity
  };

  // General method to disable input
  const disableInput = () => {
    const keyboard = document.getElementById('keyboard');
    keyboard.style.pointerEvents = 'none';
  };

  return {
    setHint,
    updateCurrentGuessDisplay,
    shakeCurrentRow,
    updateTiles,
    updateKeyboard,
    displayEndGameMessage,
    displayStats,
    disableInput,
  };
})();





// THE STORAGE MODULE

const Storage = (() => {
  // Save game state to localStorage
  const saveGameState = (state) => {
    localStorage.setItem('gameState', JSON.stringify({
      wordOfTheDay: state.wordOfTheDay,
      currentAttempt: state.currentAttempt,
      maxAttempts: state.maxAttempts,
      isGameOver: state.isGameOver,
      incorrectGuesses: state.incorrectGuesses,
      hintDisplayed: state.hintDisplayed,
      gameGuessColors: state.gameGuessColors,
      gameGuessLetters: state.gameGuessLetters,
      hintOfTheDay: state.hintOfTheDay,
      // Additional state properties as needed
    }));
  };

  // Load game state from localStorage
  const loadGameState = () => {
    const gameState = JSON.parse(localStorage.getItem('gameState'));
    if (gameState) {
      // Assuming Game module has methods to set its state
      Game.setState(gameState);
    }
  };

  // Save game statistics to localStorage
  const saveStats = (stats) => {
    localStorage.setItem('stats', JSON.stringify(stats));
  };

  // Load game statistics from localStorage
  const loadStats = () => {
    const stats = JSON.parse(localStorage.getItem('stats'));
    return stats || { /* default stats structure */ };
  };

  // Save guesses to localStorage
  const saveGuesses = () => {
    // Assuming guesses are part of game state, might not need separate handling
    // If separate, save them like so:
    const guesses = Game.getGuesses(); // Assuming Game module exposes this
    localStorage.setItem('guesses', JSON.stringify(guesses));
  };

  // Function to check if a game was played today
  const wasGamePlayedToday = () => {
    const lastPlayedDate = localStorage.getItem('lastPlayedDate');
    return lastPlayedDate === new Date().toISOString().slice(0, 10);
  };

  return {
    saveGameState,
    loadGameState,
    saveStats,
    loadStats,
    saveGuesses,
    wasGamePlayedToday,
  };
})();




// EVENT LISTENERS

document.addEventListener('DOMContentLoaded', () => {
  // Initialize game setup and UI
  Game.init().then(() => {
    UI.setInitialGameState(Game.getState());
    Storage.loadGameState();
  });

  // Virtual keyboard click handling
  document.getElementById('keyboard').addEventListener('click', (e) => {
    if (e.target.matches('.key')) {
      const key = e.target.getAttribute('data-key');
      handleKeyInput(key);
    }
  });

  // Physical keyboard input handling
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      Game.submitGuess();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      Game.deleteLastCharacter();
    } else {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/i.test(key)) {
        Game.addCharacterToGuess(key);
      }
    }
  });
});

// Handle key input from both virtual and physical keyboards
function handleKeyInput(key) {
  switch (key) {
    case 'ENTER':
      Game.submitGuess();
      break;
    case 'BACKSPACE':
      Game.deleteLastCharacter();
      break;
    default:
      Game.addCharacterToGuess(key);
  }
}


// Assuming loadData and setupInitialState are methods to fetch game data and prepare the game state.
