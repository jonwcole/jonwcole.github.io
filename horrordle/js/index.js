// Assuming ES6 module syntax
import { dataManager } from './data/dataManager.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

async function initializeGame() {
    try {
        await dataManager.loadDictionary();
        await dataManager.loadDailyWord();
        console.log('Game initialized with daily word:', dataManager.dailyWord);
        // Additional initialization steps...
        // Setup UI with the loaded word and hint
        // Setup event listeners for game interactions
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}