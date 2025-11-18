import { supabase } from '../../supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';
import { Vector2 } from '../core/Vector2.js';
import { resources } from '../core/Resources.js';
import { Sprite } from '../core/Sprite.js';
import { createChiikawaAnimations } from '../game/GameObjects.js';
import { ChatBubble } from '../ui/ChatBubble.js';

export const MY_PLAYER_ID_KEY = "myPlayerId";
export const POSITION_KEY = 'chiikawaPosition';

// Player Identity
export let myId = localStorage.getItem(MY_PLAYER_ID_KEY);
if (!myId) {
    myId = uuidv4();
    localStorage.setItem(MY_PLAYER_ID_KEY, myId);
}

// Initial Position
const savedPosition = localStorage.getItem(POSITION_KEY);
let initialPos = savedPosition ? JSON.parse(savedPosition) : { x: 300, y: 300 };
export const chiikawaPos = new Vector2(initialPos.x, initialPos.y);

// Global State
export let myName = null; 
export const chatBubble = new ChatBubble();
export let lastDirection = "RIGHT";
export let otherPlayers = []; // << FIXED: Must be 'let' to allow in-place mutation

// Remote Player Creation
export function createOtherPlayerSprite() {
    const sp = new Sprite({ resource: resources.images.chiikawa, frameSize: new Vector2(64, 64), hFrames: 7, vFrames: 11 });
    sp.animations = createChiikawaAnimations(); 
    return sp;
}

// Supabase Functions
export async function initPlayer() {
    if (!myName) return console.error("Player name is not set!");

    const { error } = await supabase.from("players").upsert([{
        id: myId,
        x: chiikawaPos.x,
        y: chiikawaPos.y,
        facing: lastDirection,
        name: myName,
        is_typing: false,
        command_animation: null 
    }], { onConflict: 'id' }); 
    
    if (error) console.error("Supabase initPlayer upsert failed:", error);
}

export async function cleanupPlayer() {
    if (!myId) return;
    try {
        const { error } = await supabase.from('players')
            .delete()
            .eq('id', myId);
        if (error) console.error("Supabase cleanupPlayer delete failed:", error);
        else console.log(`Player ${myName} (${myId}) disconnected and removed.`);
    } catch (err) {
        console.warn("Cleanup attempt failed:", err);
    }
}

// Startup Flow
export async function setupPlayerName(gameLoop) {
    const savedName = localStorage.getItem('myPlayerName');
    let playerName = savedName;

    if (!savedName) {
        do {
            playerName = prompt("Please enter your player name (max 12 characters):", "Player");
            if (playerName === null) {
                playerName = "Player" + Math.floor(Math.random() * 1000);
                break;
            }
            playerName = playerName.trim().substring(0, 12);
            if (playerName.length === 0) alert("Name cannot be empty. Please try again.");
        } while (playerName.length === 0);
        
        localStorage.setItem('myPlayerName', playerName);
    }

    myName = playerName;
    await initPlayer();
    gameLoop.start();
}

// Attach the cleanup function to the window's unload event
window.addEventListener("beforeunload", (e) => {
    cleanupPlayer();
    return null;
});