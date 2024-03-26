// Assuming ES6 module syntax
import { dataManager } from './data/dataManager.js';
import { gameState } from './state/gameState.js';
import { uiUpdater } from './ui/uiUpdater.js';
import './ui/eventListeners.js';

// Wait for the DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    gameState.init();
    gameState.loadStats(); // Make sure stats are loaded
    uiUpdater.updateStatsDisplay(gameState.stats);
    gameState.restoreGameState();
});

// Define the async function to initialize the game
async function initializeGame() {
    await dataManager.loadDictionary();
    await dataManager.loadDailyWord(); // Only necessary if this is asynchronous and not yet called
    gameState.startNewGame(dataManager.dailyWord, dataManager.hint, dataManager.dictionary);
    uiUpdater.updateStatsDisplay(gameState.stats);
}

