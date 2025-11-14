// main.js

import { resources } from './src/Resources.js';
import { Sprite } from './src/Sprite.js';
import { Vector2 } from './src/Vector2.js';
import { Gameloop } from './src/Gameloop.js';
import { Input } from './src/Input.js';
import { FrameIndexPattern } from './src/FrameIndexPattern.js';
import { Animations } from './src/Animations.js';
import { STAND_RIGHT, WALK_RIGHT, WALK_LEFT, STAND_LEFT, CRY, DANCE, SIT, SIT_IDLE, SIT_TO_STAND } from './src/objects/chiikawa/chiikawaAnimations.js';
import { Camera } from './src/Camera.js';
import { supabase } from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------
// CHAT BUBBLE DEFINITION
// ---------------------------
class ChatBubble {
    constructor() {
        this.message = "";
        this.isTyping = false;
        this.timer = 0;
        this.duration = 5000; // visible for 5s
        this.maxWidth = 150;   // max bubble width for wrapping
    }

    startTyping() {
        this.isTyping = true;
        this.message = "";
        this.timer = 0;
    }

    sendMessage() {
        this.isTyping = false;
    }

    handleKey(key) {
        if (!this.isTyping) return;
        if (key === "Backspace") this.message = this.message.slice(0, -1);
        else if (key.length === 1 && this.message.length < 50) this.message += key; // Limit message length
    }

    setMessage(message) {
        if (this.message !== message) {
            this.message = message;
            this.timer = 0;       
            this.isTyping = false;
        }
    }

    setTypingStatus(status) {
        if (this.isTyping !== status) {
            this.isTyping = status;
            if (!status && this.message.length === 0) {
                 this.message = "";
                 this.timer = 0;
            }
        }
    }

    update(delta) {
        if (!this.isTyping && this.message.length > 0) {
            this.timer += delta;
            if (this.timer >= this.duration) {
                this.message = "";
                this.timer = 0;
            }
        }
    }

    draw(ctx, x, y, nameHeight = 8, spriteHeight = 64) {
        let displayMessage = this.message;
        let showTypingAnimation = false;

        if (this.isTyping) {
            showTypingAnimation = true;
            if (this !== chatBubble) { 
                displayMessage = ""; // Hide actual message content for remote players
            }
        }

        if (displayMessage.length === 0 && !showTypingAnimation) return;

        const paddingX = 8;
        const paddingY = 4;
        const radius = 5;

        ctx.save();
        ctx.font = "10px Arial";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.imageSmoothingEnabled = true;

        let displayText = displayMessage;
        if (showTypingAnimation) {
            const dotCount = Math.floor((Date.now() / 500) % 4);
            if (displayText.length === 0) {
                 displayText = ".".repeat(dotCount);
            } else {
                 displayText += ".".repeat(dotCount);
            }
        }

        const words = displayText.split(" ");
        const lines = [];
        let currentLine = "";
        for (let word of words) {
            const testLine = currentLine ? currentLine + " " + word : word;
            if (ctx.measureText(testLine).width > this.maxWidth && currentLine !== "") {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        let textWidth = 0;
        lines.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > textWidth) textWidth = w;
        });
        
        const bubbleWidth = textWidth + paddingX * 2;
        const bubbleHeight = lines.length * 12 + paddingY * 2;

        const verticalOffset = 3; 
        const bx = Math.round(x - bubbleWidth / 2);
        const by = Math.round(y - nameHeight - bubbleHeight + verticalOffset); 

        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(bx, by, bubbleWidth, bubbleHeight, radius);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "black";
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], bx + paddingX, by + paddingY + i * 12);
        }

        ctx.restore();
    }
}

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


// --- ANIMATION CREATION FUNCTION (Ensures separate animation instances) ---
function createChiikawaAnimations() {
    return new Animations({
        // Standard Movements
        standRight: new FrameIndexPattern(STAND_RIGHT),
        walkRight: new FrameIndexPattern(WALK_RIGHT),
        standLeft: new FrameIndexPattern(STAND_LEFT),
        walkLeft: new FrameIndexPattern(WALK_LEFT), 
        
        // Command Animations
        cry: new FrameIndexPattern(CRY),
        dance: new FrameIndexPattern(DANCE), 
        sit: new FrameIndexPattern(SIT),
        sitIdle: new FrameIndexPattern(SIT_IDLE), // Now using the explicit SIT_IDLE constant
        sitToStand: new FrameIndexPattern(SIT_TO_STAND), 
    });
}
// ----------------------------------------------------------------------------


// ---------------------------
// PLAYER ANIMATIONS
// ---------------------------
// Local player gets its own independent Animations instance.
chiikawa.animations = createChiikawaAnimations();


// ---------------------------
// GAME STATE
// ---------------------------
const chiikawaPos = new Vector2(300, 300);
const input = new Input();
let lastDirection = "RIGHT";

// Get/Set Name from Local Storage
const savedName = localStorage.getItem('myPlayerName');
const myName = savedName || "Player" + Math.floor(Math.random() * 1000);
if (!savedName) {
    localStorage.setItem('myPlayerName', myName);
}

const chatBubble = new ChatBubble();

// Command state and map
let currentCommandAnimation = null;
let commandAnimationTime = 0;
const COMMAND_MAP = {
    "/cry": "cry",
    "/dance": "dance",
    "/sit": "sit", // <-- NOW TRIGGERS THE FULL SIT TRANSITION
    "/stand": "sitToStand",
    "/sitidle": "sitIdle", 
};


// ---------------------------
// CAMERA
// ---------------------------
const camera = new Camera(canvas.width, canvas.height);

// ---------------------------
// MULTIPLAYER
// ---------------------------
const MY_PLAYER_ID_KEY = "myPlayerId";
let myId = localStorage.getItem(MY_PLAYER_ID_KEY);
if (!myId) {
    myId = uuidv4();
    localStorage.setItem(MY_PLAYER_ID_KEY, myId);
}
let otherPlayers = [];

function createOtherPlayerSprite() {
    const sp = new Sprite({ resource: resources.images.chiikawa, frameSize: new Vector2(64, 64), hFrames: 7, vFrames: 4 });
    // Assign a NEW, independent animation set for the remote player.
    sp.animations = createChiikawaAnimations(); 
    return sp;
}

// ---------------------------
// INIT PLAYER
// ---------------------------
async function initPlayer() {
    const { error } = await supabase.from("players").upsert([{
        id: myId,
        x: chiikawaPos.x,
        y: chiikawaPos.y,
        facing: lastDirection,
        name: myName,
        is_typing: false,
        command_animation: null 
    }], { onConflict: 'id' }); 
    
    if (error) {
        console.error("Supabase initPlayer upsert failed:", error);
    }
}

// ---------------------------
// CHAT FUNCTIONS
// ---------------------------
async function sendChatMessage(message) {
    if (!message) return;
    try {
        await supabase.from("chat").insert([{
            player_id: myId,
            name: myName,
            message: message
        }]);
    } catch (err) {
        console.error("Supabase chat insert error:", err);
    }
}

let lastChatTimestamp = null;
async function fetchChats() {
    try {
        let query = supabase.from("chat").select("*").order("created_at", { ascending: true });
        if (lastChatTimestamp) query = query.gt("created_at", lastChatTimestamp);

        const { data, error } = await query;
        if (error) return console.error("Supabase fetch chat error:", error);

        data?.forEach(c => {
            const player = otherPlayers.find(p => p.id === c.player_id) || (c.player_id === myId ? { chat: chatBubble } : null);
            
            if (player && player.chat) {
                player.chat.setMessage(c.message);
            }
        });

        if (data?.length) lastChatTimestamp = data[data.length - 1].created_at;
    } catch (err) {
        console.error("Supabase chat fetch error:", err);
    }
}
setInterval(fetchChats, 200);

// ---------------------------
// UPDATE LOOP
// ---------------------------
const speed = 2;
const networkInterval = 200;
const INTERPOLATION_FACTOR = 0.1; 
let lastNetworkUpdate = 0;

const update = (delta) => {
    let dx = 0, dy = 0;

    // Movement calculation blocked if typing OR during sit or sitToStand transitions
    const isTransitioning = currentCommandAnimation === "sitToStand" || currentCommandAnimation === "sit";

    if (!chatBubble.isTyping && !isTransitioning) {
        if (input.heldDirections.includes("UP")) dy -= speed;
        if (input.heldDirections.includes("DOWN")) dy += speed;
        if (input.heldDirections.includes("LEFT")) { dx -= speed; lastDirection = "LEFT"; }
        if (input.heldDirections.includes("RIGHT")) { dx += speed; lastDirection = "RIGHT"; }
    }

    // Diagonal normalization
    if (dx !== 0 && dy !== 0) {
        const f = 1 / Math.sqrt(2);
        dx *= f; dy *= f;
    }
    
    // --- SIT-TO-STAND LOGIC ---
    const isMoving = (dx !== 0 || dy !== 0);
    const isSittingIdle = currentCommandAnimation === "sitIdle";

    // 1. Detect transition from SIT_IDLE to STAND (triggered by any movement input)
    if (isSittingIdle && isMoving) {
        currentCommandAnimation = "sitToStand"; 
        commandAnimationTime = 0;               
    }

    // 2. Cancel non-sit commands if movement occurs
    // Protect sitIdle, sit (transition), and sitToStand (transition) from cancellation
    if (currentCommandAnimation && 
        currentCommandAnimation !== "sitIdle" && 
        currentCommandAnimation !== "sit" &&
        currentCommandAnimation !== "sitToStand" && 
        isMoving) {
        currentCommandAnimation = null;
        commandAnimationTime = 0;
    }

    // 3. Apply movement (dx/dy will be 0 if typing or transitioning)
    chiikawaPos.x += dx;
    chiikawaPos.y += dy;
    // --------------------------

    // Track command duration for one-shot/timed animations (CRY, DANCE, SIT_TO_STAND, SIT)
    if (currentCommandAnimation) {
        commandAnimationTime += delta;
        
        let duration = Infinity; 
        
        if (currentCommandAnimation === "cry") {
            duration = 800; 
        } else if (currentCommandAnimation === "dance") {
            duration = 640; 
        } else if (currentCommandAnimation === "sitToStand") {
            duration = 800; // 8 frames * 100ms. Movement is blocked until this finishes.
        } else if (currentCommandAnimation === "sit") { // <-- Added duration for SIT
            duration = 800; 
        }
        
        // Only run this block for finite animations
        if (duration !== Infinity && commandAnimationTime >= duration) {
            
            // If SIT finished, transition to the static SIT_IDLE
            if (currentCommandAnimation === "sit") {
                currentCommandAnimation = "sitIdle";
                commandAnimationTime = 0;
            } else {
                // Animation finished one cycle (cry, dance, sitToStand), revert to idle movement
                currentCommandAnimation = null;
                commandAnimationTime = 0;
            }
        }
    }


    // Set animation state for local player
    if (currentCommandAnimation) {
        // Play the command animation (sitIdle will hold the last frame)
        chiikawa.animations.play(currentCommandAnimation);
    } else {
        // Normal walk/stand animation
        chiikawa.animations.play((dx !== 0 || dy !== 0)
            ? (lastDirection === "LEFT" ? "walkLeft" : "walkRight")
            : (lastDirection === "LEFT" ? "standLeft" : "standRight"));
    }
    
    chiikawa.step(delta);

    // Camera and Chat updates
    camera.follow({ x: chiikawaPos.x, y: chiikawaPos.y, w: chiikawa.frameSize.x, h: chiikawa.frameSize.y });
    chatBubble.update(delta);

    // Smooth other players
    otherPlayers.forEach(p => {
        const dx = p.destination.x - p.position.x;
        const dy = p.destination.y - p.position.y;

        p.position.x += dx * INTERPOLATION_FACTOR;
        p.position.y += dy * INTERPOLATION_FACTOR;

        const moving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
        p.facing = dx < -0.1 ? "LEFT" : dx > 0.1 ? "RIGHT" : p.facing;

        if (p.commandAnimation) {
            p.sprite.animations.play(p.commandAnimation);
        } else if (moving) {
            p.sprite.animations.play(p.facing === "LEFT" ? "walkLeft" : "walkRight"); 
        } else {
            p.sprite.animations.play(p.facing === "LEFT" ? "standLeft" : "standRight"); 
        }

        p.sprite.step(delta);
        p.chat.update(delta);
    });

    // Network update
    const now = performance.now();
    if (now - lastNetworkUpdate > networkInterval) {
        lastNetworkUpdate = now;
        (async () => {
            try {
                // 1. Send our player state
                const { error: upsertError } = await supabase.from("players").upsert([{
                    id: myId,
                    x: Math.round(chiikawaPos.x),
                    y: Math.round(chiikawaPos.y),
                    facing: lastDirection,
                    name: myName,
                    is_typing: chatBubble.isTyping,
                    command_animation: currentCommandAnimation
                }], { onConflict: 'id' }); 

                if (upsertError) {
                     console.error("Supabase upsert failed:", upsertError);
                }

                // 2. Fetch other players
                const { data, error } = await supabase.from("players").select("*").neq("id", myId);
                if (error) return console.error("Supabase fetch error:", error);

                const activeIds = data.map(p => p.id);
                otherPlayers = otherPlayers.filter(p => activeIds.includes(p.id));

                // 3. Update or add players
                data?.forEach(p => {
                    let existing = otherPlayers.find(op => op.id === p.id);
                    if (!existing) {
                        otherPlayers.push({
                            id: p.id,
                            name: p.name,
                            sprite: createOtherPlayerSprite(),
                            position: new Vector2(p.x, p.y),
                            destination: new Vector2(p.x, p.y),
                            facing: p.facing,
                            chat: new ChatBubble(),
                            commandAnimation: p.command_animation
                        });
                        existing = otherPlayers[otherPlayers.length - 1];
                    } 
                    
                    existing.destination.x = p.x;
                    existing.destination.y = p.y;
                    existing.facing = p.facing;

                    if (p.is_typing !== undefined) {
                        existing.chat.setTypingStatus(p.is_typing);
                    }

                    existing.commandAnimation = p.command_animation;
                });
            } catch (err) {
                console.error("Supabase network error:", err);
            }
        })();
    }
};

// ---------------------------
// DRAW LOOP
// ---------------------------
const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    waterSprite.drawImage(ctx, -camera.position.x, -camera.position.y);
    islandSprite.drawImage(ctx, -camera.position.x, -camera.position.y);

    // --- Local player ---
    const drawX = chiikawaPos.x - camera.position.x - chiikawa.frameSize.x / 2;
    const drawY = chiikawaPos.y - camera.position.y - chiikawa.frameSize.y / 2;
    const nameYOffset = 8; 

    shadow.drawImage(ctx, drawX, drawY);

    ctx.save();
    // Local player: Flip sprite if facing LEFT
    if (lastDirection === "LEFT") {
        ctx.translate(drawX + chiikawa.frameSize.x / 2, 0);
        ctx.scale(-1, 1);
        chiikawa.drawImage(ctx, -chiikawa.frameSize.x / 2, drawY);
    } else chiikawa.drawImage(ctx, drawX, drawY);
    ctx.restore();

    // Player Name Rendering (Local Player)
    ctx.textAlign = 'center';
    ctx.font = 'bold 8px monospace'; 
    const nameY = drawY + nameYOffset;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText(myName, drawX + chiikawa.frameSize.x / 2, nameY);
    
    ctx.fillStyle = 'white';
    ctx.fillText(myName, drawX + chiikawa.frameSize.x / 2, nameY);
    
    chatBubble.draw(ctx, drawX + chiikawa.frameSize.x / 2, nameY, 8, chiikawa.frameSize.y); 

    // --- Other players ---
    otherPlayers.forEach(p => {
        const px = p.position.x - camera.position.x - chiikawa.frameSize.x / 2;
        const py = p.position.y - camera.position.y - chiikawa.frameSize.y / 2;

        shadow.drawImage(ctx, px, py);

        ctx.save();
        // Remote player: Flip sprite if facing LEFT
        if (p.facing === "LEFT") { 
            ctx.translate(px + chiikawa.frameSize.x / 2, 0);
            ctx.scale(-1, 1);
            p.sprite.drawImage(ctx, -chiikawa.frameSize.x / 2, py);
        } else p.sprite.drawImage(ctx, px, py);
        ctx.restore();

        // Player Name Rendering (Other Players)
        const otherNameY = py + nameYOffset;
        
        ctx.font = 'bold 8px monospace';
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(p.name, px + chiikawa.frameSize.x / 2, otherNameY);
        
        ctx.fillStyle = 'white';
        ctx.fillText(p.name, px + chiikawa.frameSize.x / 2, otherNameY);

        // Chat Bubble draw position
        if (p.chat) p.chat.draw(ctx, px + chiikawa.frameSize.x / 2, otherNameY, 8, chiikawa.frameSize.y);
    });
};

// ---------------------------
// INPUT
// ---------------------------
window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        if (!chatBubble.isTyping) {
            // State 1: Not typing, press Enter -> Start typing
            chatBubble.startTyping(); 
        }
        else {
            // State 2: Currently typing
            
            // FIX 1: If typing and message is empty, pressing Enter exits typing mode.
            if (chatBubble.message.length === 0) {
                 chatBubble.sendMessage(); // Set isTyping to false
                 e.preventDefault();
                 return;
            }

            const commandKey = chatBubble.message.toLowerCase();
            let commandAnimation = COMMAND_MAP[commandKey];
            
            if (commandAnimation) {
                // Command detected!
                currentCommandAnimation = commandAnimation;
                commandAnimationTime = 0; 
                chatBubble.message = ""; 
                chatBubble.sendMessage(); 
            } else {
                // Send the message
                sendChatMessage(chatBubble.message);
                chatBubble.sendMessage(); 
            }
            
            // The line that previously restarted typing automatically has been removed.
        }
        e.preventDefault();
        return;
    }

    if (chatBubble.isTyping) {
        chatBubble.handleKey(e.key);
        e.preventDefault();
        return;
    }

    input.pressKey?.(e.key);
});

window.addEventListener("keyup", (e) => {
    input.releaseKey?.(e.key);
});

// ---------------------------
// START GAME
// ---------------------------
const gameLoop = new Gameloop(update, draw);
initPlayer().then(() => gameLoop.start());