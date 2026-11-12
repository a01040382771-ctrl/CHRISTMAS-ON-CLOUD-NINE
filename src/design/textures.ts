import * as THREE from "three";

/** Small procedural (canvas) textures — no image files are required. */
function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** One rounded cobble per tile; the tint comes from vertex colours. */
export function makeStoneTile() {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = "#b9a79b";
    ctx.fillRect(0, 0, s, s);
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#ece4dd");
    ctx.fillStyle = g;
    roundRect(ctx, 6, 6, s - 12, s - 12, 22);
    ctx.fill();
    // soft painted speckles
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(150,120,110,${0.04 + rnd() * 0.06})`;
      ctx.beginPath();
      ctx.ellipse(14 + rnd() * (s - 28), 14 + rnd() * (s - 28), 3 + rnd() * 9, 2 + rnd() * 5, rnd() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Timber planks running across U. */
export function makePlankTile() {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "rgba(70,30,25,0.55)";
    ctx.fillRect(0, 0, s, 5);
    let seed = 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = `rgba(90,40,35,${0.05 + rnd() * 0.07})`;
      ctx.fillRect(rnd() * s, 8 + rnd() * (s - 12), 20 + rnd() * 70, 1.5);
    }
  });
}

/** Radial falloff used by additive light halos. */
export function makeHaloTexture() {
  const tex = canvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
