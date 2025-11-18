// src/game/GameLoopLogic.js

import { Input } from '../core/Input.js';
import { Camera } from '../core/Camera.js';
import { chiikawaPos, otherPlayers, myId, myName, chatBubble, POSITION_KEY, createOtherPlayerSprite } from '../multiplayer/PlayerSetup.js';
import { chiikawaSprite } from './GameObjects.js';
import { supabase } from '../../supabaseClient.js';
import { Vector2 } from '../core/Vector2.js';
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

// Portal Definition
export const portalLocation = {
    x: 100,
    y: 100,
    width: 150,
    height: 150,
    targetLobby: "NEW_LOBBY_ROOM"
};

const COLLISION_MARGIN = 30; 

// Game State
export const input = new Input();
let dx = 0;
let dy = 0;
let lastNetworkUpdate = 0;
let lastDirection = "RIGHT";

// Mutable State
export const currentCommandAnimation = { value: null };
export const commandAnimationTime = { value: 0 };
export const gameTimerSeconds = { value: 20.0 };
export const playersInPortalCount = { value: 0 };

// Camera (will be initialized dynamically)
export let camera;

/**
 * Initialize canvas-dependent game state
 * Must be called after canvas is created
 */
export function initGameLogic(canvas) {
    camera = new Camera(canvas.width, canvas.height);
}

/**
 * Check if a player's position is inside the portal
 */
function isPlayerInPortal(pos, spriteSize) {
    const playerHalfW = spriteSize.x / 2;
    const playerHalfH = spriteSize.y / 2;

    const effectiveX = portalLocation.x + COLLISION_MARGIN;
    const effectiveY = portalLocation.y + COLLISION_MARGIN;
    const effectiveWidth = portalLocation.width - 2 * COLLISION_MARGIN;
    const effectiveHeight = portalLocation.height - 2 * COLLISION_MARGIN;

    return (
        pos.x + playerHalfW > effectiveX &&
        pos.x - playerHalfW < effectiveX + effectiveWidth &&
        pos.y + playerHalfH > effectiveY &&
        pos.y - playerHalfH < effectiveY + effectiveHeight
    );
}

/**
 * Main game update function
 */
export function update(delta) {
    if (!delta || !chiikawaSprite) return;

    // --- Players in portal
    let count = 0;
    if (isPlayerInPortal(chiikawaPos, chiikawaSprite.frameSize)) count++;
    otherPlayers.forEach(p => {
        if (p.sprite && isPlayerInPortal(p.position, p.sprite.frameSize)) count++;
    });
    playersInPortalCount.value = count;

    // --- Timer logic
    if (playersInPortalCount.value > 0) {
        gameTimerSeconds.value = Math.max(0, gameTimerSeconds.value - delta / 1000);
    } else {
        gameTimerSeconds.value = 20.0;
    }

    // --- Input handling
    dx = 0;
    dy = 0;

    const command = currentCommandAnimation.value;
    let commandTime = commandAnimationTime.value;
    const isTransitioning = command === "sitToStand" || command === "sit";
    const isSittingLoop = command === "sitLoop";

    if (!chatBubble.isTyping && !isTransitioning && !isSittingLoop) {
        if (input.heldDirections.includes("UP")) dy -= speed;
        if (input.heldDirections.includes("DOWN")) dy += speed;
        if (input.heldDirections.includes("LEFT")) {
            dx -= speed;
            lastDirection = "LEFT";
        }
        if (input.heldDirections.includes("RIGHT")) {
            dx += speed;
            lastDirection = "RIGHT";
        }
    } else if (isSittingLoop && !chatBubble.isTyping) {
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

    // Cancel command animation if moving
    if (command && !isSittingLoop && !isTransitioning && (dx !== 0 || dy !== 0)) {
        currentCommandAnimation.value = null;
        commandAnimationTime.value = 0;
    }

    // Apply movement
    chiikawaPos.x += dx;
    chiikawaPos.y += dy;

    // Command animation timing
    if (currentCommandAnimation.value) {
        commandTime += delta;
        let duration = Infinity;
        if (currentCommandAnimation.value === "sitToStand" || currentCommandAnimation.value === "sit") duration = 800;
        else if (currentCommandAnimation.value === "cry" || currentCommandAnimation.value === "dance") duration = 1600;

        if (duration !== Infinity && commandTime >= duration) {
            if (currentCommandAnimation.value === "sit") currentCommandAnimation.value = "sitLoop";
            else currentCommandAnimation.value = null;
            commandTime = 0;
        }
        commandAnimationTime.value = commandTime;
    }

    // Camera follow
    if (camera && chiikawaSprite) {
        camera.follow({ x: chiikawaPos.x, y: chiikawaPos.y, w: chiikawaSprite.frameSize.x, h: chiikawaSprite.frameSize.y });
    }

    // Other players smoothing
    otherPlayers.forEach(p => {
        const dx = p.destination.x - p.position.x;
        const dy = p.destination.y - p.position.y;
        p.position.x += dx * INTERPOLATION_FACTOR;
        p.position.y += dy * INTERPOLATION_FACTOR;

        if (Math.abs(dx) > 0.1) p.facing = dx < 0 ? "LEFT" : "RIGHT";

        p.sprite.hFlip = p.facing === "LEFT";
        if (p.commandAnimation) p.sprite.animations.play(p.commandAnimation);
        else if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) p.sprite.animations.play(p.facing === "LEFT" ? "walkLeft" : "walkRight");
        else p.sprite.animations.play(p.facing === "LEFT" ? "standLeft" : "standRight");

        p.sprite.step(delta);
        p.chat.update(delta);
    });

    // Network update (rate-limited)
    const now = performance.now();
    if (now - lastNetworkUpdate > networkInterval) {
        lastNetworkUpdate = now;
        (async () => {
            try {
                // Save local position
                localStorage.setItem(POSITION_KEY, JSON.stringify({
                    x: Math.round(chiikawaPos.x),
                    y: Math.round(chiikawaPos.y)
                }));

                // Upsert local player
                await supabase.from("players").upsert([{
                    id: myId,
                    x: Math.round(chiikawaPos.x),
                    y: Math.round(chiikawaPos.y),
                    facing: lastDirection,
                    name: myName,
                    is_typing: chatBubble.isTyping,
                    command_animation: currentCommandAnimation.value,
                    last_seen_at: new Date().toISOString()
                }], { onConflict: "id" });

                // Fetch other active players
                const TEN_SECONDS_AGO = new Date(Date.now() - 10000).toISOString();
                const { data } = await supabase.from("players")
                    .select("*")
                    .neq("id", myId)
                    .gt("last_seen_at", TEN_SECONDS_AGO);

                const nextPlayers = [];
                (data || []).forEach(p => {
                    let existing = otherPlayers.find(op => op.id === p.id);
                    if (!existing) {
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
                    existing.destination.x = p.x;
                    existing.destination.y = p.y;
                    existing.facing = p.facing;
                    existing.chat.setTypingStatus(p.is_typing);
                    existing.commandAnimation = p.command_animation;
                    nextPlayers.push(existing);
                });

                otherPlayers.length = 0;
                otherPlayers.push(...nextPlayers);
            } catch (err) {
                console.error("Supabase network error:", err);
            }
        })();
    }
}
