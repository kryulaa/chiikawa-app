import { resources } from './src/Resources.js';
import { Sprite } from './src/Sprite.js';
import { Vector2 } from './src/Vector2.js';
import { Gameloop } from './src/Gameloop.js';
import { Input } from './src/Input.js';
import { FrameIndexPattern } from './src/FrameIndexPattern.js';
import { Animations } from './src/Animations.js';
import { STAND_RIGHT, WALK_RIGHT } from './src/objects/chiikawa/chiikawaAnimations.js';
import { Camera } from './src/Camera.js';
import { ChatBubble } from './src/ChatBubble.js'; // scaled bubble

// ---------------------------
// CANVAS SETUP
// ---------------------------
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

canvas.width = 720;
canvas.height = 480;

function resizeCanvas() {
    const scaleX = window.innerWidth / canvas.width;
    const scaleY = window.innerHeight / canvas.height;
    const scale = Math.max(scaleX, scaleY);
    canvas.style.width = canvas.width * scale + "px";
    canvas.style.height = canvas.height * scale + "px";
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---------------------------
// SPRITES
// ---------------------------
const waterSprite = new Sprite({ resource: resources.images.water, frameSize: new Vector2(720, 480) });
const islandSprite = new Sprite({ resource: resources.images.island, frameSize: new Vector2(720, 480) });
const chiikawa = new Sprite({ resource: resources.images.chiikawa, frameSize: new Vector2(64, 64), hFrames: 7, vFrames: 4 });
const shadow = new Sprite({ resource: resources.images.chiikawa_shadow, frameSize: new Vector2(64, 64) });

// ---------------------------
// GAME STATE
// ---------------------------
const chiikawaPos = new Vector2(300, 300);
const input = new Input();
let lastDirection = "RIGHT";

const chiikawaAnimations = new Animations({
    stand: new FrameIndexPattern(STAND_RIGHT),
    walk: new FrameIndexPattern(WALK_RIGHT)
});
chiikawa.animations = chiikawaAnimations;

// ---------------------------
// CAMERA
// ---------------------------
const camera = new Camera(canvas.width, canvas.height);

// ---------------------------
// CHAT
// ---------------------------
const chatBubble = new ChatBubble(64 / 12); // scale relative to Chiikawa sprite

window.addEventListener("keydown", e => {
    if (e.code === "Enter") {
        if (!chatBubble.isTyping) chatBubble.startTyping();
        else chatBubble.sendMessage();
    } else {
        chatBubble.handleKey(e.key);
    }
});

// ---------------------------
// UPDATE LOOP
// ---------------------------
const update = (delta) => {
    let dx = 0, dy = 0;

    if (!chatBubble.isTyping) {
        const dirs = input.heldDirections;
        if (dirs.includes("UP")) dy -= 1;
        if (dirs.includes("DOWN")) dy += 1;
        if (dirs.includes("LEFT")) { dx -= 1; lastDirection = "LEFT"; }
        if (dirs.includes("RIGHT")) { dx += 1; lastDirection = "RIGHT"; }
    }

    if (dx !== 0 && dy !== 0) {
        const f = 1 / Math.sqrt(2);
        dx *= f; dy *= f;
    }

    chiikawaPos.x += dx;
    chiikawaPos.y += dy;

    if (dx !== 0 || dy !== 0) chiikawa.animations.play("walk");
    else chiikawa.animations.play("stand");

    chiikawa.step(delta);

    camera.follow({ x: chiikawaPos.x, y: chiikawaPos.y, w: chiikawa.frameSize.x, h: chiikawa.frameSize.y });

    chatBubble.update(delta);
};

// ---------------------------
// DRAW LOOP
// ---------------------------
const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    waterSprite.drawImage(ctx, -camera.position.x, -camera.position.y);
    islandSprite.drawImage(ctx, -camera.position.x, -camera.position.y);

    // Calculate Chiikawa screen position
    const drawX = chiikawaPos.x - camera.position.x - chiikawa.frameSize.x / 2;
    const drawY = chiikawaPos.y - camera.position.y - chiikawa.frameSize.y / 2;

    // Draw shadow
    shadow.drawImage(ctx, drawX, drawY);

    // Draw Chiikawa
    if (lastDirection === "LEFT") chiikawa.drawMirrored(ctx, drawX, drawY);
    else chiikawa.drawImage(ctx, drawX, drawY);

    // Draw scaled chat bubble above Chiikawa
    const bubbleOffsetY = -chiikawa.frameSize.y - -70; // adjust vertical offset
    chatBubble.draw(ctx, drawX + chiikawa.frameSize.x / 2, drawY + bubbleOffsetY);
};

// ---------------------------
// START GAME LOOP
// ---------------------------
const gameLoop = new Gameloop(update, draw);
gameLoop.start();
