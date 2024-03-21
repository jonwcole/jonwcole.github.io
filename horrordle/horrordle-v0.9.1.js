//------------------//
// Game data module //
//------------------//

const GameDataModule = (() => {
  let dictionary = [];
  let wordOfTheDay = '';
  let hintOfTheDay = '';
  const gameStatsKey = 'horrordleStats';
  const gameStateKey = 'horrordleGameState';

  async function loadDictionary() {
    try {
      const response = await fetch('https://jonwcole.github.io/horrordle/dictionary.json');
      dictionary = await response.json();
    } catch (error) {
      console.error('Error loading dictionary:', error);
    }
  }

  async function loadWordOfTheDay() {
    try {
      const response = await fetch('https://jonwcole.github.io/horrordle/words.json');
      const words = await response.json();
      const today = getLocalDateISOString();
      const wordData = words[today];
      if (wordData) {
        wordOfTheDay = wordData.word.toUpperCase();
        hintOfTheDay = wordData.hint;
        saveGameState();
      } else {
        console.error('Word for today not found');
      }
    } catch (error) {
      console.error('Error loading word of the day:', error);
    }
  }

  function getLocalDateISOString() {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const adjustedNow = new Date(now - timezoneOffset);
    return adjustedNow.toISOString().slice(0, 10);
  }

  function saveGameState() {
    const gameState = {
      lastPlayedDate: getLocalDateISOString(),
      wordOfTheDay,
      hintOfTheDay
    };
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
  }

  function loadGameState() {
    const gameState = JSON.parse(localStorage.getItem(gameStateKey));
    if (gameState && gameState.lastPlayedDate === getLocalDateISOString()) {
      wordOfTheDay = gameState.wordOfTheDay;
      hintOfTheDay = gameState.hintOfTheDay;
      // Further restoration if needed
    } else {
      // New day or first play, reset as necessary
    }
  }

  function getTodayDate() {
      const now = new Date();
      const timezoneOffset = now.getTimezoneOffset() * 60000;
      const adjustedNow = new Date(now.getTime() - timezoneOffset);
      return adjustedNow.toISOString().slice(0, 10);
  }

  return {
    loadGame: async () => {
      await loadDictionary();
      await loadWordOfTheDay();
    },
    getWordOfTheDay: () => wordOfTheDay,
    getHintOfTheDay: () => hintOfTheDay,
    getTodayDate,
  };
})();



//-----------//
// UI module //
//-----------//

const UIModule = (() => {
  function updateCurrentGuessDisplay(attempt, currentGuess) {
    const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
    const tiles = currentRow.querySelectorAll('.tile .front');
    tiles.forEach((tile, index) => {
      tile.textContent = index < currentGuess.length ? currentGuess[index] : '';
    });
  }

  function clearCurrentGuessDisplay(attempt) {
    updateCurrentGuessDisplay(attempt, []); // Clear by updating with an empty guess
  }

  function updateTiles(attempt, guess, result) {
    const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
    const tiles = currentRow.querySelectorAll('.tile');
    tiles.forEach((tile, index) => {
      const back = tile.querySelector('.back');
      back.textContent = guess[index];
      tile.className = `tile ${result[index]}`; // Add class based on result to tile for CSS styling
      // Optionally, trigger animation here
    });
  }

  function shakeCurrentRow(attempt) {
    const currentRow = document.querySelector(`.tile-row-wrapper[data-attempt="${attempt}"]`);
    currentRow.classList.add('shake');
    setTimeout(() => currentRow.classList.remove('shake'), 1000); // Remove class after animation completes
  }

  function displayWinMessage() {
    // Display win message logic here
  }

  function displayEndGameMessage(won) {
    const messageElement = document.getElementById(won ? 'win-message' : 'lose-message');
    messageElement.style.display = 'block';
    // Optionally, add more UI feedback for end game
  }

  function updateKeyboard(guess, result) {
    // Iterate through guess and update keyboard based on result
    guess.split('').forEach((letter, index) => {
      const keyElement = document.querySelector(`.keyboard .key[data-key="${letter}"]`);
      if (result[index] === 'correct') {
        keyElement.classList.add('correct');
      } else if (result[index] === 'present') {
        keyElement.classList.add('present');
      } else {
        keyElement.classList.add('absent');
      }
    });
  }

  function disableInput() {
      // Example of disabling input. This could be more complex depending on your application's structure.
      // Here, we're disabling the on-screen keyboard.
      const keys = document.querySelectorAll('.key');
      keys.forEach(key => key.setAttribute('disabled', true));
  }

  function restoreGuess(attempt, index, letter, color) {
      // Implementation for restoring a single guess in the UI
  }

  function restoreUIFromGameState(gameState) {
      // Example restoration logic
      // This will likely involve iterating over gameState properties
      // and updating the UI accordingly
      const { gameGuessLetters, gameGuessColors } = gameState;

      gameGuessLetters.forEach((letters, attempt) => {
          letters.forEach((letter, index) => {
              const color = gameGuessColors[attempt][index];
              restoreGuess(attempt, index, letter, color);
          });
      });

      // Additional UI updates based on gameState (e.g., displaying hints, word of the day, etc.)
  }

  return {
    updateCurrentGuessDisplay,
    clearCurrentGuessDisplay,
    updateTiles,
    shakeCurrentRow,
    displayWinMessage,
    displayEndGameMessage,
    updateKeyboard,
    disableInput,
    restoreUIFromGameState,
    // Additional UI functions as needed
  };
})();



//-------------------//
// Game Logic module //
//-------------------//

const GameLogicModule = ((gameDataModule, uiModule) => {
  let currentGuess = [];
  let attempts = 0;
  const maxAttempts = 6;
  let isGameOver = false;

  function addCharacterToGuess(character) {
    if (isGameOver || currentGuess.length >= 5) return;
    currentGuess.push(character);
    uiModule.updateCurrentGuessDisplay(attempts, currentGuess);
  }

  function deleteLastCharacter() {
    if (isGameOver || currentGuess.length === 0) return;
    currentGuess.pop();
    uiModule.updateCurrentGuessDisplay(attempts, currentGuess);
  }

  function submitGuess() {
    if (isGameOver || currentGuess.length < 5) return;
    const guessStr = currentGuess.join('');
    if (!gameDataModule.validateWord(guessStr)) {
      uiModule.shakeCurrentRow(attempts);
      return;
    }
    processGuess(guessStr);
    currentGuess = []; // Reset for next guess
    uiModule.clearCurrentGuessDisplay(attempts); // Prepare for next guess input
    if (checkGameOver()) {
      endGame();
    } else {
      attempts++;
    }
  }

  function processGuess(guess) {
    const result = gameDataModule.compareWord(guess);
    uiModule.updateTiles(attempts, guess, result);
    if (guess === gameDataModule.getWordOfTheDay()) {
      isGameOver = true;
      uiModule.displayWinMessage();
    }
  }

  function checkGameOver() {
    return attempts >= maxAttempts - 1 || currentGuess.join('') === gameDataModule.getWordOfTheDay();
  }

  function endGame() {
    isGameOver = true;
    uiModule.displayEndGameMessage(currentGuess.join('') === gameDataModule.getWordOfTheDay());
    // Additional end game logic like updating stats could go here
  }

  function restoreGameState(gameState) {
      uiModule.disableInput(); // Disable input to prevent further actions during state restoration

      // Use destructuring with default values to ensure we always have arrays
      const { 
          gameGuessLetters = [], 
          gameGuessColors = [], 
          gameOutcome 
      } = gameState || {}; // Also protect against gameState being undefined

      // Now safe to use forEach, as we ensured gameGuessLetters and gameGuessColors are arrays
      gameGuessLetters.forEach((guessLetters, attempt) => {
          guessLetters.forEach((letter, index) => {
              uiModule.restoreGuess(attempt, index, letter, gameGuessColors[attempt]?.[index]);
          });
      });

      if (gameOutcome === 'lost') {
          uiModule.displayWordOfTheDay(); // Show word if the game was lost
      }

      if (gameState?.hintDisplayed) {
          uiModule.displayHint(); // Show hint if it was displayed in the previous session
      }
  }

  return {
    addCharacterToGuess,
    deleteLastCharacter,
    submitGuess,
    restoreGameState,
    // Other public methods or properties as needed
  };
})(GameDataModule, UIModule);


//--------------//
// Input module //
//--------------//

const InputModule = ((gameDataModule, gameLogicModule, uiModule) => {
  // Assuming these modules are passed as dependencies to handle game logic and UI updates

  function initialize() {
    document.getElementById('keyboard').addEventListener('click', handleVirtualKeyPress);
    document.addEventListener('keydown', handlePhysicalKeyPress);
  }

  function handleVirtualKeyPress(event) {
    if (event.target.classList.contains('key')) {
      const key = event.target.getAttribute('data-key');
      processKey(key);
    }
  }

  function handlePhysicalKeyPress(event) {
    const allowedKeys = ['Enter', 'Backspace'];
    const key = event.key.toUpperCase();

    if (allowedKeys.includes(event.key) || /^[A-Z]$/i.test(key)) {
      event.preventDefault(); // Prevent default behavior for handled keys
      processKey(event.key === 'Enter' ? 'ENTER' : event.key === 'Backspace' ? 'BACKSPACE' : key);
    }
  }

  function processKey(key) {
    switch (key) {
      case 'ENTER':
        gameLogicModule.submitGuess();
        break;
      case 'BACKSPACE':
        gameLogicModule.deleteLastCharacter();
        break;
      default:
        gameLogicModule.addCharacterToGuess(key);
    }
  }

  function enableInput(enable) {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
      if (enable) {
        key.removeAttribute('disabled');
        key.classList.remove('disabled');
      } else {
        key.setAttribute('disabled', 'true');
        key.classList.add('disabled');
      }
    });
  }

  return {
    initialize,
    enableInput,
  };
})(GameDataModule, GameLogicModule, UIModule); // Dependency injection

// Remember to call InputModule.initialize() somewhere in your game initialization logic.



//----------------//
// Storage module //
//---------------//

const StorageModule = (() => {
  const gameStateKey = 'horrordleGameState';
  const gameStatsKey = 'horrordleStats';

  function saveGameState(gameState) {
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
  }

  function loadGameState() {
    const gameStateJSON = localStorage.getItem(gameStateKey);
    return gameStateJSON ? JSON.parse(gameStateJSON) : null;
  }

  function saveGameStats(stats) {
    localStorage.setItem(gameStatsKey, JSON.stringify(stats));
  }

  function loadGameStats() {
    const statsJSON = localStorage.getItem(gameStatsKey);
    return statsJSON ? JSON.parse(statsJSON) : {
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    };
  }

  function clearGameData() {
    localStorage.removeItem(gameStateKey);
    // Optionally, clear other data related to the game
  }

  function clearGameStats() {
    localStorage.removeItem(gameStatsKey);
  }

  return {
    saveGameState,
    loadGameState,
    saveGameStats,
    loadGameStats,
    clearGameData,
    clearGameStats,
    // Additional utility functions as needed
  };
})();


//--------------//
// Stats module //
//--------------//

const StatsModule = ((storageModule) => {
  let stats = {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
  };

  function loadStats() {
    const loadedStats = storageModule.loadGameStats();
    if (loadedStats) {
      stats = loadedStats;
    }
  }

  function updateStats(gameWon, guessesTaken) {
    stats.gamesPlayed += 1;
    if (gameWon) {
      stats.wins += 1;
      stats.currentStreak += 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      stats.guessDistribution[guessesTaken] = (stats.guessDistribution[guessesTaken] || 0) + 1;
    } else {
      stats.currentStreak = 0;
    }
    storageModule.saveGameStats(stats);
  }

  function displayStats() {
    // Assuming there are UI elements with these IDs to display the stats
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('win-percentage').textContent = ((stats.wins / stats.gamesPlayed) * 100).toFixed(2) + '%';
    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('max-streak').textContent = stats.maxStreak;
    // Update guess distribution display...
    Object.entries(stats.guessDistribution).forEach(([guessCount, count]) => {
      const element = document.getElementById(`distribution-${guessCount}`);
      if (element) {
        element.textContent = count;
        // Additional logic for visual representation of distribution...
      }
    });
  }

  function resetStats() {
    stats = {
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    };
    storageModule.saveGameStats(stats);
    displayStats();
  }

  return {
    loadStats,
    updateStats,
    displayStats,
    resetStats
  };
})(StorageModule);

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  StatsModule.loadStats();
  StatsModule.displayStats();
});
