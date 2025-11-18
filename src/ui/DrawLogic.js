// src/ui/DrawLogic.js

import { chiikawaSprite, shadow, waterSprite, islandSprite } from '../game/GameObjects.js';
import { chiikawaPos, myName, chatBubble, otherPlayers } from '../multiplayer/PlayerSetup.js';
import { portalLocation, gameTimerSeconds, playersInPortalCount } from '../game/GameLoopLogic.js';

export const draw = (ctx, canvas, camera) => {
    if (!ctx || !canvas || !camera || !chiikawaSprite) return; // safety check

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background Elements
    waterSprite.drawImage(ctx, -camera.position.x, -camera.position.y);
    islandSprite.drawImage(ctx, -camera.position.x, -camera.position.y);

    // --- Draw the Portal Area ---
    const playerCount = playersInPortalCount.value;
    const maxPlayers = 20;
    const portalScreenX = portalLocation.x - camera.position.x;
    const portalScreenY = portalLocation.y - camera.position.y;

    ctx.save();
    ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 4;
    ctx.fillRect(portalScreenX, portalScreenY, portalLocation.width, portalLocation.height);
    ctx.strokeRect(portalScreenX, portalScreenY, portalLocation.width, portalLocation.height);

    // READY count
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = playerCount === maxPlayers ? '#F87171' : 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`READY: ${playerCount}/${maxPlayers}`, portalScreenX + portalLocation.width / 2, portalScreenY + portalLocation.height / 2);

    // Timer inside portal
    if (playerCount > 0) {
        const timerValue = Math.max(0, gameTimerSeconds.value);
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#FFDD55';
        ctx.fillText(timerValue.toFixed(1), portalScreenX + portalLocation.width / 2, portalScreenY + portalLocation.height / 2 + 30);
    }
    ctx.restore();

    // --- Prepare Entities to Draw ---
    const entitiesToDraw = [];

    // Local player
    entitiesToDraw.push({
        y: chiikawaPos.y,
        drawX: chiikawaPos.x - camera.position.x - chiikawaSprite.frameSize.x / 2,
        drawY: chiikawaPos.y - camera.position.y - chiikawaSprite.frameSize.y / 2,
        sprite: chiikawaSprite,
        shadow: shadow,
        facing: chiikawaSprite.hFlip ? "LEFT" : "RIGHT",
        name: myName,
        chat: chatBubble,
        frameSize: chiikawaSprite.frameSize
    });

    // Remote players
    otherPlayers.forEach(p => {
        if (!p.sprite) return;
        entitiesToDraw.push({
            y: p.position.y,
            drawX: p.position.x - camera.position.x - p.sprite.frameSize.x / 2,
            drawY: p.position.y - camera.position.y - p.sprite.frameSize.y / 2,
            sprite: p.sprite,
            shadow: shadow,
            facing: p.facing,
            name: p.name,
            chat: p.chat,
            frameSize: p.sprite.frameSize
        });
    });

    // Sort for depth
    entitiesToDraw.sort((a, b) => a.y - b.y);

    // --- Draw entities ---
    entitiesToDraw.forEach(entity => {
        const { drawX, drawY, sprite, shadow, facing, name, chat, frameSize } = entity;

        // Draw shadow
        shadow.drawImage(ctx, drawX, drawY);

        // Draw sprite
        ctx.save();
        if (facing === "LEFT") {
            ctx.translate(drawX + frameSize.x / 2, drawY + frameSize.y / 2);
            ctx.scale(-1, 1);
            sprite.drawImage(ctx, -frameSize.x / 2, -frameSize.y / 2);
        } else {
            sprite.drawImage(ctx, drawX, drawY);
        }
        ctx.restore();

        // Draw name
        ctx.textAlign = 'center';
        ctx.font = 'bold 8px monospace';
        const nameX = drawX + frameSize.x / 2;
        const nameY = drawY + 8;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(name, nameX, nameY);
        ctx.fillStyle = 'white';
        ctx.fillText(name, nameX, nameY);

        // Draw chat bubble
        if (chat) chat.draw(ctx, nameX, nameY, 8, frameSize.y);
    });

    // --- Top-right HUD ---
    if (playerCount > 0) {
        const countText = `Ready: ${playerCount}/${maxPlayers}`;
        ctx.save();
        const margin = 10;
        const indicatorX = canvas.width - margin;
        const countY = margin + 16;

        // Player count
        ctx.textAlign = 'right';
        ctx.font = 'bold 16px monospace';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(countText, indicatorX, countY);
        ctx.fillStyle = playerCount >= maxPlayers ? '#F87171' : playerCount >= maxPlayers / 2 ? '#FBBF24' : '#6EE7B7';
        ctx.fillText(countText, indicatorX, countY);

        // Timer
        const timerValue = Math.max(0, gameTimerSeconds.value);
        const timerText = timerValue.toFixed(1);
        ctx.font = 'bold 24px monospace';
        const timerY = countY + 30;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(timerText, indicatorX, timerY);
        ctx.fillStyle = timerValue > 10 ? '#6EE7B7' : timerValue > 5 ? '#FBBF24' : '#F87171';
        ctx.fillText(timerText, indicatorX, timerY);
        ctx.restore();
    }
};
