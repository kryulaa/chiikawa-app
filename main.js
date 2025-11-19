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