import { setupCanvas } from "./src/ui/CanvasSetup.js";
import { Gameloop } from "./src/core/Gameloop.js";
import { update, currentCommandAnimation, commandAnimationTime } from "./src/game/GameLoopLogic.js";
import { draw } from "./src/ui/DrawLogic.js";
import { setupPlayerName } from "./src/multiplayer/PlayerSetup.js";

import "./src/game/GameObjects.js";
import "./src/game/InputHandler.js";
import "./src/multiplayer/Networking.js";

window.setCommandAnimation = (command, time) => {
  currentCommandAnimation.value = command;
  commandAnimationTime.value = time;
};

export function startGame(canvas) {
    const ctx = setupCanvas(canvas); // setup canvas and get ctx

    const gameLoop = new Gameloop(
        (delta) => update(delta),
        () => draw(ctx, canvas) // pass ctx and canvas here
    );

    setupPlayerName(gameLoop);
}
