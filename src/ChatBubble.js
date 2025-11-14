export class ChatBubble {
    constructor() {
        this.message = "";
        this.isTyping = false;
        this.timer = 0;
        this.duration = 3000; // bubble visible 3s
    }

    startTyping() {
        this.isTyping = true;
        this.message = "";
    }

    sendMessage() {
        this.isTyping = false;
        this.timer = 0;
    }

    handleKey(key) {
        if (!this.isTyping) return;
        if (key === "Backspace") this.message = this.message.slice(0, -1);
        else if (key.length === 1) this.message += key;
    }

    update(delta) {
        if (!this.isTyping && this.message.length > 0) {
            this.timer += delta;
            if (this.timer > this.duration) this.message = "";
        }
    }

        draw(ctx, x, y) {
        // Show nothing if no message and not typing
        if (!this.message && !this.isTyping) return;

        const padding = 6;
        const bubbleHeight = 15;
        const radius = 5;

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.font = "10px Arial";
        ctx.textBaseline = "middle";

        // Determine text to display
        let displayText = this.message;
        if (this.isTyping) {
            // Animate typing indicator "..."
            const dotCount = Math.floor((Date.now() / 500) % 4); // 0 to 3 dots
            displayText = displayText + ".".repeat(dotCount);
        }

        const textWidth = ctx.measureText(displayText).width;
        const bubbleWidth = textWidth + padding * 2;

        // Round positions to integers for sharp edges
        const bx = Math.round(x - bubbleWidth / 2);
        const by = Math.round(y - bubbleHeight);
        const tx = Math.round(x - textWidth / 2);
        const ty = Math.round(y - bubbleHeight / 2);

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
        ctx.fillText(displayText, tx, ty);

        ctx.restore();
    }
}