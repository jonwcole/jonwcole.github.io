// Assuming ES6 module syntax
import { dataManager } from './data/dataManager.js';
import { gameState } from './state/gameState.js';
import { uiUpdater } from './ui/uiUpdater.js';
import { inputHandler } from './logic/inputHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});


async function initializeGame() {
    try {
        await dataManager.loadDictionary();
        await dataManager.loadDailyWord();
        console.log('Game initialized with daily word:', dataManager.dailyWord);
        // Start a new game with the loaded word and hint
        gameState.startNewGame(dataManager.dailyWord, dataManager.hint);
        
        // Further initialization...
        console.log('Game initialized:', gameState.getGameStatus());
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}
