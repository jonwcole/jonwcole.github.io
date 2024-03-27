// Assuming ES6 module syntax
import { dataManager } from './data/dataManager.js';
import { gameState } from './state/gameState.js';
import { uiUpdater } from './ui/uiUpdater.js';
import './ui/eventListeners.js';
import './logic/inputHandler.js';

async function initializeGame() {
    await dataManager.loadDictionary();
    await dataManager.loadDailyWord();
    const existingGameData = gameState.loadExistingGameData();

    const scenario = gameState.determineScenario(existingGameData); // Implement this

    switch(scenario) {
        case 'FIRST_TIME_USER':
            gameState.startNewGame(dataManager.dailyWord, dataManager.hint);
            break;
        case 'UNFINISHED_SAME_DAY':
            gameState.restoreUnfinishedGame();
            break;
        case 'FINISHED_SAME_DAY':
            gameState.restoreFinishedGame();
            break;
        case 'NEW_DAY':
            gameState.startNewGame(dataManager.dailyWord, dataManager.hint);
            break;
        default:
            console.log('Scenario not recognized:', scenario);
            break;
    }
    uiUpdater.updateStatsDisplay(gameState.stats);
}

// Wait for the DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGame(); // Ensure game is initialized before proceeding
    gameState.init(uiUpdater); // Configures the gameState with uiUpdater
    gameState.restoreGameState();
    uiUpdater.updateStatsDisplay(gameState.stats);
    // If updateUI is designed to refresh the UI based on the gameState's current state, call it here after restoration and UI initialization
    gameState.updateUI(); // Assuming this now internally uses the uiUpdater initialized earlier
});