// Data URLs
const DICTIONARY_URL = 'https://jonwcole.github.io/horrordle/dictionary-v1.json';
const DAILY_WORD_URL = 'https://jonwcole.github.io/horrordle/words-v1.json';

// DataManager class definition
class DataManager {
    constructor() {
        this.dictionary = [];
        this.dailyWord = '';
        this.hint = '';
    }

    async loadDictionary() {
        try {
            const response = await fetch(DICTIONARY_URL);
            const data = await response.json();
            this.dictionary = data.map(word => word.toUpperCase());
            console.log('Dictionary loaded successfully.');
        } catch (error) {
            console.error('Error loading dictionary:', error);
        }
    }

    async loadDailyWord() {
        try {
            const response = await fetch(DAILY_WORD_URL);
            const data = await response.json();
            const today = this.getTodayDateString();
            const wordData = data[today];

            if (wordData) {
                this.dailyWord = wordData.word.toUpperCase();
                this.hint = wordData.hint; // Ensure this line correctly assigns the hint
                console.log('Daily word and hint loaded successfully. Hint:', this.hint); // Check the hint
            } else {
                console.error('Daily word for today not found.');
            }
        } catch (error) {
            console.error('Error loading daily word:', error);
        }
    }

    getTodayDateString() {
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const adjustedNow = new Date(now.getTime() - timezoneOffset);
        return adjustedNow.toISOString().slice(0, 10);
    }
}

// Exporting an instance of DataManager for use in other modules
export const dataManager = new DataManager();