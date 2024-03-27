import { handleKeyPress } from '../logic/inputHandler.js';
import { gameState } from '../state/gameState.js';
import { generateResultString } from '../state/gameState.js';

document.getElementById('keyboard').addEventListener('click', function(event) {
    event.preventDefault();
    if (!gameState.isInputEnabled()) return; // Ignore clicks if input is disabled
    const key = event.target.getAttribute('data-key');
    if (key) {
        handleKeyPress(key);
    }
});

document.getElementById('share-result').addEventListener('click', async () => {
    const resultString = generateResultString();

    if (navigator.share) {
        try {
            await navigator.share({ text: resultString });
            console.log('Result shared successfully');
        } catch (error) {
            console.error('Error sharing the result:', error);
        }
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(resultString)
            .then(() => alert('Result copied to clipboard'))
            .catch(err => console.error('Failed to copy result to clipboard:', err));
    }
});