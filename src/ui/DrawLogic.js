import { chiikawaSprite, shadow, waterSprite, islandSprite } from '../game/GameObjects.js';
import { chiikawaPos, myName, chatBubble, otherPlayers } from '../multiplayer/PlayerSetup.js';
import { camera, portalLocation, gameTimerSeconds, playersInPortalCount } from '../game/GameLoopLogic.js';
import { ctx, canvas } from './CanvasSetup.js';

export const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background Elements (Water and Island)
    waterSprite.drawImage(ctx, -camera.position.x, -camera.position.y);
    islandSprite.drawImage(ctx, -camera.position.x, -camera.position.y);

    // --- Draw the Portal Area ---
    const playerCount = playersInPortalCount.value;
    const maxPlayers = 20;

    // The portal should be drawn relative to the camera position
    const portalScreenX = portalLocation.x - camera.position.x;
    const portalScreenY = portalLocation.y - camera.position.y;

    ctx.save();
    ctx.fillStyle = 'rgba(100, 150, 255, 0.5)'; // Translucent blue/purple
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 4;
    
    // Draw the main portal area (rectangle)
    ctx.fillRect(portalScreenX, portalScreenY, portalLocation.width, portalLocation.height);
    ctx.strokeRect(portalScreenX, portalScreenY, portalLocation.width, portalLocation.height);

    // Add the new READY COUNT label inside the portal
    const portalReadyText = `READY: ${playerCount}/${maxPlayers}`;

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace'; 
    ctx.fillStyle = (playerCount === maxPlayers) ? '#F87171' : 'white'; // Change color when full
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(
        portalReadyText, 
        portalScreenX + portalLocation.width / 2, 
        portalScreenY + portalLocation.height / 2
    );
    
    // Add timer text below the READY count inside the portal if running
    if (playerCount > 0) {
        const timerValue = Math.max(0, gameTimerSeconds.value);
        const timerText = timerValue.toFixed(1);

        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#FFDD55'; // Yellow timer color
        
        ctx.fillText(
            timerText, 
            portalScreenX + portalLocation.width / 2, 
            portalScreenY + portalLocation.height / 2 + 30 // Displayed slightly lower
        );
    }
    
    ctx.restore();

    const entitiesToDraw = [];

    // --- Prepare Local Player Data ---
    // We are relying on chiikawaSprite.hFlip being set in GameLoopLogic.js
    entitiesToDraw.push({
        y: chiikawaPos.y,
        drawX: chiikawaPos.x - camera.position.x - chiikawaSprite.frameSize.x / 2,
        drawY: chiikawaPos.y - camera.position.y - chiikawaSprite.frameSize.y / 2,
        sprite: chiikawaSprite,
        shadow: shadow,
        // Use sprite's internal flip state to derive facing direction for manual draw flip
        facing: chiikawaSprite.hFlip ? "LEFT" : "RIGHT", 
        name: myName,
        chat: chatBubble,
        frameSize: chiikawaSprite.frameSize
    });

    // --- Prepare Other Players Data ---
    otherPlayers.forEach(p => {
        entitiesToDraw.push({
            y: p.position.y,
            drawX: p.position.x - camera.position.x - p.sprite.frameSize.x / 2,
            drawY: p.position.y - camera.position.y - p.sprite.frameSize.y / 2,
            sprite: p.sprite,
            shadow: shadow,
            facing: p.facing, // Remote player facing is driven by network state
            name: p.name,
            chat: p.chat,
            frameSize: p.sprite.frameSize
        });
    });

    // Sort by Y position for depth (painter's algorithm)
    entitiesToDraw.sort((a, b) => a.y - b.y);

    // --- Draw Sorted Entities ---
    entitiesToDraw.forEach(entity => {
        const { drawX, drawY, sprite, shadow, facing, name, chat, frameSize } = entity;
        const nameYOffset = 8;
        
        // 1. Draw Shadow
        shadow.drawImage(ctx, drawX, drawY);

        // 2. Draw Sprite (with Canvas Flip Transformation)
        ctx.save();
        if (facing === "LEFT") {
            // Translate the origin to the center of the sprite
            ctx.translate(drawX + frameSize.x / 2, drawY + frameSize.y / 2);
            
            // Apply horizontal scaling (flip)
            ctx.scale(-1, 1);
            
            // Draw the sprite, offset to center it after the transformation
            sprite.drawImage(ctx, -frameSize.x / 2, -frameSize.y / 2);
        } else {
            // Draw normally
            sprite.drawImage(ctx, drawX, drawY);
        }
        ctx.restore();

        // 3. Draw Name
        ctx.textAlign = 'center';
        ctx.font = 'bold 8px monospace';
        const nameY = drawY + nameYOffset;
        const nameX = drawX + frameSize.x / 2;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(name, nameX, nameY);

        ctx.fillStyle = 'white';
        ctx.fillText(name, nameX, nameY);
        
        // 4. Draw Chat Bubble
        if (chat) chat.draw(ctx, nameX, nameY, 8, frameSize.y);
    });

    // --- Draw Player Count Indicator and Timer (Top Right HUD) ---
    // Only display the HUD indicators if at least one player is ready
    if (playerCount > 0) {
        const countText = `Ready: ${playerCount}/${maxPlayers}`;

        ctx.save();
        
        const margin = 10;
        const indicatorX = canvas.width - margin;
        
        // 1. Draw Player Count (Ready Indicator)
        ctx.textAlign = 'right';
        ctx.font = 'bold 16px monospace';
        const countY = margin + 16; 

        // Draw text with black stroke for visibility against any background
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(countText, indicatorX, countY);

        // Color the text based on capacity
        if (playerCount >= maxPlayers) {
            ctx.fillStyle = '#F87171'; // Red (Full)
        } else if (playerCount >= maxPlayers / 2) {
            ctx.fillStyle = '#FBBF24'; // Yellowish
        } else {
            ctx.fillStyle = '#6EE7B7'; // Greenish
        }
        ctx.fillText(countText, indicatorX, countY);

        // 2. Draw Countdown Timer
        const timerValue = Math.max(0, gameTimerSeconds.value);
        const timerText = timerValue.toFixed(1); // 1 decimal place

        ctx.font = 'bold 24px monospace';
        
        const timerY = countY + 30; // 30 pixels below player count

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(timerText, indicatorX, timerY);

        if (timerValue > 10) {
            ctx.fillStyle = '#6EE7B7'; // Green
        } else if (timerValue > 5) {
            ctx.fillStyle = '#FBBF24'; // Yellow
        } else {
            ctx.fillStyle = '#F87171'; // Red (urgent)
        }
        ctx.fillText(timerText, indicatorX, timerY);
        
        ctx.restore();
    }
};