// Assuming ES6 module syntax
import { dataManager } from './data/dataManager.js';
import { gameState } from './state/gameState.js';
import { uiUpdater } from './ui/uiUpdater.js';
import './ui/eventListeners.js';
import './logic/inputHandler.js';

async function initializeGame() {
    await dataManager.loadDictionary();
    await dataManager.loadDailyWord();
    gameState.startNewGame(dataManager.dailyWord, dataManager.hint, dataManager.dictionary);
    
    // Pass uiUpdater to gameState.init to provide UI functionality
    gameState.init(uiUpdater);
    
    // If gameState.restoreGameState() and uiUpdater.updateStatsDisplay() require DOM elements,
    // ensure they are called after DOMContentLoaded.
    gameState.restoreGameState();
    uiUpdater.updateStatsDisplay(gameState.stats);
}

// Ensure the DOM is fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGame();
});