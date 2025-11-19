// ---------------------------
// IMPORTS (relative to main.js at project root)
// ---------------------------
import { Gameloop } from './core/Gameloop.js';
import { update, currentCommandAnimation, commandAnimationTime } from './game/GameLoopLogic.js';
import { draw } from './ui/DrawLogic.js';
import { setupPlayerName } from './multiplayer/PlayerSetup.js';

// Import and execute setup modules (no assignment needed)
import './ui/CanvasSetup.js';
import './game/GameObjects.js';
import './multiplayer/Networking.js';
import './game/InputHandler.js';

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
