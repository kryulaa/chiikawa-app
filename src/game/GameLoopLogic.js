import { Input } from '../core/Input.js';
import { Camera } from '../core/Camera.js';
import { chiikawaPos, otherPlayers, myId, myName, chatBubble, POSITION_KEY, createOtherPlayerSprite } from '../multiplayer/PlayerSetup.js';
import { chiikawaSprite } from './GameObjects.js';
import { supabase } from '../../supabaseClient.js';
import { Vector2 } from '../core/Vector2.js';
import { canvas } from '../ui/CanvasSetup.js';
import { ChatBubble } from '../ui/ChatBubble.js';

// Constants
const speed = 2;
const networkInterval = 200;
const INTERPOLATION_FACTOR = 0.1;
export const COMMAND_MAP = {
    "/cry": "cry",
    "/dance": "dance",
    "/sit": "sit",
    "/stand": "sitToStand",
};

// --- Portal Definition ---
/**
 * Defines the lobby portal area for collision checking.
 * It is now placed near the spawn point (100, 100) for easy access.
 */
export const portalLocation = {
    x: 100,      // Top-left X coordinate of the portal box (Visual Boundary)
    y: 100,       // Top-left Y coordinate of the portal box (Visual Boundary)
    width: 150,   // Width of the portal box (Visual Boundary)
    height: 150,  // Height of the portal box (Visual Boundary)
    targetLobby: "NEW_LOBBY_ROOM" // Identifier for the target lobby/scene
};

// NEW: Collision margin to shrink the active ready zone inside the visual portal box.
const COLLISION_MARGIN = 30; 

// Game State
export const input = new Input();
let dx = 0;
let dy = 0;
let lastNetworkUpdate = 0;
let lastDirection = "RIGHT";

// Mutable State Objects
export const currentCommandAnimation = { value: null };
export const commandAnimationTime = { value: 0 };
export const gameTimerSeconds = { value: 20.0 }; // Starting the timer at 20 seconds
export const playersInPortalCount = { value: 0 }; // Counter for players in the portal

// Camera
export const camera = new Camera(canvas.width, canvas.height);

/**
 * Checks if a player's position is within the portal boundaries.
 * The effective collision area is smaller than the drawn box (using COLLISION_MARGIN).
 * @param {{x: number, y: number}} pos The player's center position.
 * @param {{x: number, y: number, frameSize: {x: number, y: number}}} spriteSize The sprite's frame size {x, y}.
 * @returns {boolean} True if the player is inside the portal area.
 */
function isPlayerInPortal(pos, spriteSize) {
    const playerHalfW = spriteSize.x / 2;
    const playerHalfH = spriteSize.y / 2;
    
    // Define the smaller, effective collision box coordinates
    const effectiveX = portalLocation.x + COLLISION_MARGIN;
    const effectiveY = portalLocation.y + COLLISION_MARGIN;
    const effectiveWidth = portalLocation.width - (2 * COLLISION_MARGIN);
    const effectiveHeight = portalLocation.height - (2 * COLLISION_MARGIN);

    return (
        // Horizontal check: player bounding box overlaps effective box
        pos.x + playerHalfW > effectiveX &&
        pos.x - playerHalfW < effectiveX + effectiveWidth &&
        // Vertical check: player bounding box overlaps effective box
        pos.y + playerHalfH > effectiveY &&
        pos.y - playerHalfH < effectiveY + effectiveHeight
    );
}

/**
 * The main game update function, called every frame.
 * @param {number} delta - Time elapsed since the last frame in milliseconds.
 */
export function update(delta) {

    // ------------------------------------------
    // A. SYNCHRONOUS GAME LOGIC
    // ------------------------------------------
    if (delta > 0) {
        
        // --- Players in Portal Count Calculation ---
        let count = 0;
        if (chiikawaSprite) {
            // 1. Check local player
            if (isPlayerInPortal(chiikawaPos, chiikawaSprite.frameSize)) {
                count++;
            }
        }

        // 2. Check remote players (using their current interpolated position)
        otherPlayers.forEach(p => {
            if (p.sprite && isPlayerInPortal(p.position, p.sprite.frameSize)) {
                count++;
            }
        });

        playersInPortalCount.value = count;

        // --- Conditional Countdown Timer Logic ---
        if (playersInPortalCount.value > 0) {
            // Only count down if there is at least 1 player in the portal
            if (gameTimerSeconds.value > 0) {
                gameTimerSeconds.value -= delta / 1000; // Decrement by seconds
                if (gameTimerSeconds.value < 0) {
                    gameTimerSeconds.value = 0;
                    console.log("Countdown finished! Game starting or event triggering...");
                }
            }
        } else {
            // If no players are in the portal, reset the timer to 20.0
            gameTimerSeconds.value = 20.0;
        }

        const command = currentCommandAnimation.value;
        let commandTime = commandAnimationTime.value;

        const isTransitioning = command === "sitToStand" || command === "sit";
        const isSittingLoop = command === "sitLoop";

        // --- Input Reading & Movement Blocking ---
        dx = 0;
        dy = 0;

        if (!input) {
            console.error("Input handler is not initialized!");
            return;
        }

        if (!chatBubble.isTyping && !isTransitioning && !isSittingLoop) {
            if (input.heldDirections.includes("UP")) dy -= speed;
            if (input.heldDirections.includes("DOWN")) dy += speed;

            if (input.heldDirections.includes("LEFT")) {
                dx -= speed;
                lastDirection = "LEFT"; // Update direction when moving left
            }
            if (input.heldDirections.includes("RIGHT")) {
                dx += speed;
                lastDirection = "RIGHT"; // Update direction when moving right
            }
        }
        else if (isSittingLoop && !chatBubble.isTyping) {
            // Exit sit loop if any direction is held
            if (input.heldDirections.length > 0) {
                currentCommandAnimation.value = "sitToStand";
                commandAnimationTime.value = 0;
            }
        }

        // Diagonal normalization
        if (dx !== 0 && dy !== 0) {
            const f = 1 / Math.sqrt(2);
            dx *= f; dy *= f;
        }

        const isMoving = (dx !== 0 || dy !== 0);

        // --- Animation Command Logic ---
        // Cancel command animation if player moves (unless sitting)
        if (command && !isSittingLoop && !isTransitioning && isMoving) {
            currentCommandAnimation.value = null;
            commandAnimationTime.value = 0;
        }

        // Apply movement
        chiikawaPos.x += dx;
        chiikawaPos.y += dy;

        // Track command duration
        if (currentCommandAnimation.value) {
            commandTime += delta;

            let duration = Infinity;
            
            // Define finite durations for transitions and one-shot animations
            if (currentCommandAnimation.value === "sitToStand" || currentCommandAnimation.value === "sit") {
                duration = 800;
            }
            else if (currentCommandAnimation.value === "cry" || currentCommandAnimation.value === "dance") {
                duration = 1600;
            }

            // Handle end of finite-duration animations
            if (duration !== Infinity && commandTime >= duration) {
                if (currentCommandAnimation.value === "sit") {
                    currentCommandAnimation.value = "sitLoop"; // Transition to loop state
                    commandTime = 0;
                }
                else {
                    currentCommandAnimation.value = null; // Animation finishes
                    commandTime = 0;
                }
            }
            commandAnimationTime.value = commandTime;
        }

        // --- Portal Collision Check (Teleport Trigger) ---
        if (chiikawaSprite && window.teleportToNewLobby) {
            // Note: The actual teleport logic should likely check if the timer is 0 
            // and the required players are ready, but for now, we keep the simple collision check.
            if (isPlayerInPortal(chiikawaPos, chiikawaSprite.frameSize)) {
                // Trigger the teleport action defined in the main script
                // window.teleportToNewLobby(portalLocation.targetLobby); // Disabled to prevent accidental teleport
            }
        }
        
        // Set animation state for local player (CRITICAL SECTION)
        if (chiikawaSprite) {
            // 🌟 FIX: Apply horizontal flip for local player based on lastDirection 🌟
            chiikawaSprite.hFlip = (lastDirection === "LEFT");
            
            if (currentCommandAnimation.value) {
                chiikawaSprite.animations.play(currentCommandAnimation.value);
            } else {
                chiikawaSprite.animations.play((dx !== 0 || dy !== 0)
                    ? (lastDirection === "LEFT" ? "walkLeft" : "walkRight")
                    : (lastDirection === "LEFT" ? "standLeft" : "standRight"));
            }

            // STEP SPRITE (Allows animation to advance frames)
            chiikawaSprite.step(delta);
        }

        // Camera and Chat updates
        if (chiikawaSprite) {
            camera.follow({ x: chiikawaPos.x, y: chiikawaPos.y, w: chiikawaSprite.frameSize.x, h: chiikawaSprite.frameSize.y });
        }
        chatBubble.update(delta);

        // Smooth other players and step their sprites
        otherPlayers.forEach(p => {
            const dx = p.destination.x - p.position.x;
            const dy = p.destination.y - p.position.y;

            // Interpolation
            p.position.x += dx * INTERPOLATION_FACTOR;
            p.position.y += dy * INTERPOLATION_FACTOR;

            // Determine remote facing direction
            if (Math.abs(dx) > 0.1) {
                p.facing = dx < 0 ? "LEFT" : "RIGHT";
            }
            
            const moving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;

            // Set animation and flip remote sprite
            p.sprite.hFlip = (p.facing === "LEFT"); // Apply hFlip to remote player
            
            if (p.commandAnimation) {
                p.sprite.animations.play(p.commandAnimation);
            } else if (moving) {
                p.sprite.animations.play(p.facing === "LEFT" ? "walkLeft" : "walkRight");
            } else {
                p.sprite.animations.play(p.facing === "LEFT" ? "standLeft" : "standRight");
            }

            p.sprite.step(delta); // STEP REMOTE SPRITE
            p.chat.update(delta);
        });
    }

    // ------------------------------------------
    // B. ASYNCHRONOUS NETWORK LOGIC (RATE-LIMITED)
    // ------------------------------------------
    const now = performance.now();
    if (now - lastNetworkUpdate > networkInterval) {
        lastNetworkUpdate = now;
        
        // Use an IIFE for async network operations
        (async () => {
            try {
                // 0. Save local player position to localStorage
                localStorage.setItem(POSITION_KEY, JSON.stringify({
                    x: Math.round(chiikawaPos.x),
                    y: Math.round(chiikawaPos.y)
                }));

                // 1. Send our player state
                const { error: upsertError } = await supabase.from("players").upsert([{
                    id: myId,
                    x: Math.round(chiikawaPos.x),
                    y: Math.round(chiikawaPos.y),
                    facing: lastDirection,
                    name: myName,
                    is_typing: chatBubble.isTyping,
                    command_animation: currentCommandAnimation.value,
                    last_seen_at: new Date().toISOString()
                }], { onConflict: 'id' });

                if (upsertError) console.error("Supabase upsert failed:", upsertError);

                // 2. Fetch other active players (last 10 seconds)
                const TEN_SECONDS_AGO = new Date(Date.now() - 10000).toISOString();
                
                const { data, error } = await supabase.from("players")
                    .select("*")
                    .neq("id", myId)
                    .gt("last_seen_at", TEN_SECONDS_AGO);

                if (error) return console.error("Supabase fetch error:", error);

                // 3. Update the otherPlayers array (reconciliation)
                const activePlayersData = data || [];
                const nextPlayers = [];

                activePlayersData.forEach(p => {
                    let existing = otherPlayers.find(op => op.id === p.id);

                    if (!existing) {
                        // Create new player object if not found
                        existing = {
                            id: p.id,
                            name: p.name,
                            sprite: createOtherPlayerSprite(),
                            position: new Vector2(p.x, p.y),
                            destination: new Vector2(p.x, p.y),
                            facing: p.facing,
                            chat: new ChatBubble(),
                            commandAnimation: p.command_animation
                        };
                    }
                    
                    // Update destination for interpolation
                    existing.destination.x = p.x;
                    existing.destination.y = p.y;
                    existing.facing = p.facing;

                    if (p.is_typing !== undefined) {
                        existing.chat.setTypingStatus(p.is_typing);
                    }

                    existing.commandAnimation = p.command_animation;
                    
                    nextPlayers.push(existing);
                });

                // Modify the 'otherPlayers' array *in place* to update global reference
                otherPlayers.length = 0;
                otherPlayers.push(...nextPlayers);

            } catch (err) {
                console.error("Supabase network error:", err, err.stack);
            }
        })();
    }
}