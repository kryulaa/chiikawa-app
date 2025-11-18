export function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  canvas.width = 720;
  canvas.height = 480;

  function resizeCanvas() {
    const scaleX = window.innerWidth / canvas.width;
    const scaleY = window.innerHeight / canvas.height;
    const scale = Math.max(scaleX, scaleY);
    canvas.style.width = canvas.width * scale + "px";
    canvas.style.height = canvas.height * scale + "px";
  }

  window.addEventListener("resize", resizeCanvas, false);
  resizeCanvas();

  return ctx;
}
