export class ChatBubble {
    constructor() {
        this.message = "";
        this.isTyping = false;
        this.timer = 0;
        this.duration = 5000;
        this.maxWidth = 150;
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
        else if (key.length === 1 && this.message.length < 50) this.message += key;
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
            
            if (status) {
                this.message = "";
                this.timer = 0;
            }

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
        let showTypingAnimation = this.isTyping;

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