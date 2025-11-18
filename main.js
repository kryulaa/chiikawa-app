// ---------------------------
// IMPORTS (relative to main.js at project root)
// ---------------------------
import { Gameloop } from './src/Gameloop.js';
import { update, currentCommandAnimation, commandAnimationTime } from './src/GameLoopLogic.js';
import { draw } from './src/DrawLogic.js';
import { setupPlayerName } from './src/PlayerSetup.js';

// Import and execute setup modules (no assignment needed)
import './src/CanvasSetup.js';
import './src/GameObjects.js';
import './src/Networking.js';
import './src/InputHandler.js';

// ---------------------------
// STATE MUTATION BRIDGE
// ---------------------------
// Allows InputHandler.js to modify mutable state safely
window.setCommandAnimation = (command, time) => {
    currentCommandAnimation.value = command;
    commandAnimationTime.value = time;
};

// ---------------------------
// GAME LOOP AND START
// ---------------------------
const gameLoop = new Gameloop(update, draw);
setupPlayerName(gameLoop);
