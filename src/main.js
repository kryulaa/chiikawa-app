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