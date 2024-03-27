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

    navigator.clipboard.writeText(resultString)
        .then(() => {
            // Display the copy confirmation instead of an alert
            document.getElementById('copy-confirmation').style.display = 'block';
            document.getElementById('copy-confirmation').style.opacity = '1';
            
            // Optionally, you might want to hide the confirmation after a few seconds
            setTimeout(() => {
                document.getElementById('copy-confirmation').style.display = 'none';
                document.getElementById('copy-confirmation').style.opacity = '0';
            }, 6000); // Adjust time as needed
        })
        .catch(err => console.error('Failed to copy result to clipboard:', err));
});