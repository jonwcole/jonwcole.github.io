import { handleKeyPress } from '../logic/inputHandler.js'; // Adjust the path as needed

document.getElementById('keyboard').addEventListener('click', function(event) {
    event.preventDefault();
    const key = event.target.getAttribute('data-key');
    if (key) {
        handleKeyPress(key);
    }
});