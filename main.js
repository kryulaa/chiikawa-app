// Change './src/' to '/src/' for all import paths

import { Gameloop } from './src/core/Gameloop.js';
import { update, currentCommandAnimation, commandAnimationTime } from './src/game/GameLoopLogic.js';
import { draw } from './src/ui/DrawLogic.js';
import { setupPlayerName } from './src/multiplayer/PlayerSetup.js';

// Import and execute setup modules (no assignment needed)
import '/src/ui/CanvasSetup.js'; // FIX 5
import '/src/game/GameObjects.js'; // FIX 6
import '/src/multiplayer/Networking.js'; // FIX 7
import '/src/game/InputHandler.js'; // FIX 8


// ---------------------------
// STATE MUTATION BRIDGE
// ---------------------------
// This bridge function allows InputHandler.js to safely modify the mutable state 
// objects in GameLoopLogic.js.
window.setCommandAnimation = (command, time) => {
    currentCommandAnimation.value = command;
    commandAnimationTime.value = time;
};


// ---------------------------
// GAME LOOP AND START
// ---------------------------
const gameLoop = new Gameloop(update, draw);
setupPlayerName(gameLoop);