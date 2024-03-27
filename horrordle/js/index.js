// Assuming ES6 module syntax
import { dataManager } from './data/dataManager.js';
import { gameState } from './state/gameState.js';
import { uiUpdater } from './ui/uiUpdater.js';
import './ui/eventListeners.js';
import './logic/inputHandler.js';

// Wait for the DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGame(); // Ensure game is initialized before proceeding
    gameState.restoreGameState();
    uiUpdater.updateStatsDisplay(gameState.stats);
});

async function initializeGame() {
    await dataManager.loadDictionary();
    await dataManager.loadDailyWord();
    gameState.startNewGame(dataManager.dailyWord, dataManager.hint, dataManager.dictionary);
    gameState.init(); // Assuming init configures the game state without overwriting loaded state
    // Consider moving gameState.loadStats() into gameState.init() or startNewGame
    uiUpdater.updateStatsDisplay(gameState.stats); // Update UI with the initial or restored game state
}

