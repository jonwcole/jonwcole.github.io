// Assuming ES6 module syntax
import { dataManager } from './data/dataManager.js';
import { gameState } from './state/gameState.js';
import { uiUpdater } from './ui/uiUpdater.js';
import './ui/eventListeners.js';
import './logic/inputHandler.js';

async function initializeGame() {
    await dataManager.loadDictionary();
    await dataManager.loadDailyWord();
    // Pass the daily word and hint directly from dataManager to gameState
    gameState.loadGameDetails(dataManager.dailyWord, dataManager.hint, dataManager.dictionary);
}

// Wait for the DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGame();
    gameState.init(uiUpdater); // Configures the gameState with uiUpdater
    uiUpdater.updateStatsDisplay(gameState.stats); // Update UI with the initial or restored game state
});
