// ---------------------------
// IMPORTS (relative to main.js at project root)
// ---------------------------
import { Gameloop } from './src/core/Gameloop.js';
import { update, currentCommandAnimation, commandAnimationTime } from './src/game/GameLoopLogic.js';
import { draw } from './src/ui/DrawLogic.js';
import { setupPlayerName } from './src/multiplayer/PlayerSetup.js';

// Import and execute setup modules (no assignment needed)
import './src/ui/CanvasSetup.js';
import './src/game/GameObjects.js';
import './src/multiplayer/Networking.js';
import './src/game/InputHandler.js';

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
