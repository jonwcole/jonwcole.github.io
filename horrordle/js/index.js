// Assuming ES6 module syntax
import { dataManager } from './data/dataManager.js';
import { gameState } from './state/gameState.js';
import { uiUpdater } from './ui/uiUpdater.js';
import './ui/eventListeners.js';
import './logic/inputHandler.js';

// Wait for the DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGame(); // Ensure game is initialized before proceeding
    gameState.init(uiUpdater); // Configures the gameState with uiUpdater
    gameState.restoreGameState();
    uiUpdater.updateStatsDisplay(gameState.stats);
    // If updateUI is designed to refresh the UI based on the gameState's current state, call it here after restoration and UI initialization
    gameState.updateUI(); // Assuming this now internally uses the uiUpdater initialized earlier
});

async function initializeGame() {
    await dataManager.loadDictionary();
    await dataManager.loadDailyWord();
    gameState.loadGameDetails(dataManager.dailyWord, dataManager.hint, dataManager.dictionary);
    gameState.init(uiUpdater); // Configures the gameState with uiUpdater
    gameState.startNewGame(dataManager.dailyWord, dataManager.hint, dataManager.dictionary);
    uiUpdater.updateStatsDisplay(gameState.stats); // Update UI with the initial or restored game state
}