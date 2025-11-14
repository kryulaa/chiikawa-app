export class ChatBubble {
    constructor() {
        this.message = "";
        this.isTyping = false;
        this.timer = 0;
        this.duration = 5000; // visible for 5s
        this.maxWidth = 150;   // max bubble width for wrapping
    }

    startTyping() {
        this.isTyping = true;
        this.message = "";
        this.timer = 0;
    }

    sendMessage() {
        this.isTyping = false;
        this.timer = 0; // reset timer to start countdown
    }

    handleKey(key) {
        if (!this.isTyping) return;
        if (key === "Backspace") this.message = this.message.slice(0, -1);
        else if (key.length === 1) this.message += key;
    }

    setMessage(message) {
        this.message = message;
        this.timer = 0;       // start counting for display duration
        this.isTyping = false;
    }

    update(delta) {
        // Only start countdown after typing finished or message set
        if (!this.isTyping && this.message.length > 0) {
            this.timer += delta;
            if (this.timer >= this.duration) {
                this.message = "";
                this.timer = 0;
            }
        }
    }

    draw(ctx, x, y, nameHeight = 14, spriteHeight = 64) {
        if (!this.message && !this.isTyping) return;

        const paddingX = 8;
        const paddingY = 4;
        const radius = 5;

        ctx.save();
        ctx.font = "10px Arial";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.imageSmoothingEnabled = true;

        // Typing animation
        let displayText = this.message;
        if (this.isTyping) {
            const dotCount = Math.floor((Date.now() / 500) % 4);
            displayText += ".".repeat(dotCount);
        }

        // Wrap long text
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

        // Bubble size
        let textWidth = 0;
        lines.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > textWidth) textWidth = w;
        });
        const bubbleWidth = textWidth + paddingX * 2;
        const bubbleHeight = lines.length * 12 + paddingY * 2;

        // Bubble position above player
        const bx = Math.round(x - bubbleWidth / 2);
        const by = Math.round(y - spriteHeight - nameHeight - bubbleHeight - 5);

        // Draw bubble
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(bx, by, bubbleWidth, bubbleHeight, radius);
        ctx.fill();
        ctx.stroke();

        // Draw text
        ctx.fillStyle = "black";
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], bx + paddingX, by + paddingY + i * 12);
        }

        ctx.restore();
    }
}
