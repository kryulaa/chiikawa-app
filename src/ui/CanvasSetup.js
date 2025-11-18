// CANVAS SETUP
export const canvas = document.getElementById("game-canvas");
export const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
canvas.width = 720;
canvas.height = 480;

function resizeCanvas() {
    const scaleX = window.innerWidth / canvas.width;
    const scaleY = window.innerHeight / canvas.height;
    
    // 🌟 FIX: Use Math.max to ensure the canvas covers the entire screen,
    // maintaining the 3:2 aspect ratio without stretching. 
    // This allows parts of the canvas to be off-screen.
    const scale = Math.max(scaleX, scaleY); 
    
    canvas.style.width = canvas.width * scale + "px";
    canvas.style.height = canvas.height * scale + "px";
}
window.addEventListener("resize", resizeCanvas, false);
resizeCanvas();