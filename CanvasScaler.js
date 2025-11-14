export class CanvasScaler {
    constructor(canvas, targetWidth = 320, targetHeight = 180) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;

        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);

        this.resize();
    }

    resize() {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // maintain 16:9
        const targetRatio = this.targetWidth / this.targetHeight;
        const screenRatio = screenW / screenH;

        let scale;
        if (screenRatio > targetRatio) {
            // screen is wider → limit by height
            scale = screenH / this.targetHeight;
        } else {
            // screen is taller → limit by width
            scale = screenW / this.targetWidth;
        }

        // Apply actual visible canvas size
        this.canvas.style.width = `${this.targetWidth * scale}px`;
        this.canvas.style.height = `${this.targetHeight * scale}px`;

        // Internal resolution stays fixed (no blur)
        this.canvas.width = this.targetWidth;
        this.canvas.height = this.targetHeight;
    }

    begin() {
        // clear internal resolution
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
