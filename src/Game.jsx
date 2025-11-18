import React, { useEffect } from "react";
import { startGame } from "../main.js"; // relative path ✅

export default function Game() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.id = "game-canvas";
    canvas.width = 720;
    canvas.height = 480;
    document.getElementById("root").appendChild(canvas);

    startGame(canvas);

    return () => {
      canvas.remove();
    };
  }, []);

  return <div id="game-container"></div>;
}
