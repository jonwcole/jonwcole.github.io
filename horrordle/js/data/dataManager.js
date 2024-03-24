// Data URLs
const DICTIONARY_URL = 'https://jonwcole.github.io/horrordle/dictionary-v1.json';
const DAILY_WORD_URL = 'https://jonwcole.github.io/horrordle/words-v1.json';

class DataManager {
    constructor() {
        this.dictionary = [];
        this.dailyWord = '';
        this.hint = '';
    }

    // Fetch and load the dictionary of words
    async loadDictionary() {
        try {
            const response = await fetch(DICTIONARY_URL);
            const data = await response.json();
            this.dictionary = data.map(word => word.toUpperCase()); // Convert words to uppercase
            console.log('Dictionary loaded successfully.');
        } catch (error) {
            console.error('Error loading dictionary:', error);
        }
    }

    // Fetch and set the daily word and hint
    async loadDailyWord() {
        try {
            const response = await fetch(DAILY_WORD_URL);
            const data = await response.json();
            const today = this.getTodayDateString();
            const wordData = data[today];

            if (wordData) {
                this.dailyWord = wordData.word.toUpperCase(); // Convert to uppercase
                this.hint = wordData.hint;
                console.log('Daily word and hint loaded successfully.');
            } else {
                console.error('Daily word for today not found.');
            }
        } catch (error) {
            console.error('Error loading daily word:', error);
        }
    }

    // Helper function to get today's date as a string in YYYY-MM-DD format
    getTodayDateString() {
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const adjustedNow = new Date(now - timezoneOffset);
        return adjustedNow.toISOString().slice(0, 10);
    }
}

// Export the DataManager class for use in other modules
// dataManager.js

export const dataManager = {
    dictionary: [],
    dailyWord: '',
    hint: '',

    async loadDictionary() {
        try {
            const response = await fetch('path/to/your/dictionary.json');
            const words = await response.json();
            this.dictionary = words;
            console.log('Dictionary loaded successfully.');
        } catch (error) {
            console.error('Failed to load dictionary:', error);
        }
    },

    async loadDailyWordAndHint() {
        // Example logic for loading the daily word and hint
        try {
            // Assuming these are stored in a JSON file or fetched from an API
            const response = await fetch('path/to/dailyWordAndHint.json');
            const data = await response.json();
            this.dailyWord = data.dailyWord;
            this.hint = data.hint;
            console.log('Daily word and hint loaded successfully.');
        } catch (error) {
            console.error('Failed to load daily word and hint:', error);
        }
    },

    // Other data loading methods as needed...
};
