import * as THREE from "three";
import { mulberry32 } from "./geo";

/**
 * Procedural, hand-painted-feel textures drawn once on small canvases
 * (≤512px) — no external assets, tiny memory footprint.
 */

function canvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
}

function finish(c: HTMLCanvasElement, repeat = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function blotches(g: CanvasRenderingContext2D, size: number, rnd: () => number, colors: string[], n: number, rmin: number, rmax: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * size, y = rnd() * size, r = rmin + rnd() * (rmax - rmin);
    g.globalAlpha = alpha * (0.4 + rnd() * 0.6);
    g.fillStyle = colors[Math.floor(rnd() * colors.length)];
    // wrap-around so the texture tiles
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      g.beginPath();
      g.ellipse(x + ox, y + oy, r, r * (0.6 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

/** Warm plaster with soft brush mottling. Tinted by the material colour. */
export function plasterTexture() {
  const S = 256, rnd = mulberry32(11);
  const { c, g } = canvas(S);
  g.fillStyle = "#f4ece6";
  g.fillRect(0, 0, S, S);
  blotches(g, S, rnd, ["#ffffff", "#f0e2d8", "#e8d6cc", "#fbf3ee"], 70, 10, 40, 0.35);
  blotches(g, S, rnd, ["#d9c3b8"], 40, 2, 7, 0.25);
  return finish(c);
}

/** Cobblestones: rounded pastel stones, snow in the mortar. */
export function cobbleTexture() {
  const S = 512, rnd = mulberry32(5);
  const { c, g } = canvas(S);
  g.fillStyle = "#cdbcb4"; // mortar + snow dust
  g.fillRect(0, 0, S, S);
  const palette = ["#e9d3c8", "#dcc3b8", "#e3cfc9", "#d2bdb8", "#efdcd0", "#cfc3c6"];
  const cell = 64;
  for (let row = 0; row < S / (cell * 0.62) + 1; row++) {
    const y = row * cell * 0.62;
    const off = (row % 2) * cell * 0.5;
    for (let x = -cell; x < S + cell; x += cell * 0.98) {
      const w = cell * (0.72 + rnd() * 0.2), h = cell * (0.46 + rnd() * 0.12);
      const cx = x + off + rnd() * 5, cy = y + rnd() * 4;
      for (const oy of [0, S, -S]) for (const ox of [0, S, -S]) {
        const gr = g.createRadialGradient(cx + ox - w * 0.15, cy + oy - h * 0.2, 1, cx + ox, cy + oy, w * 0.6);
        const col = palette[Math.floor(rnd() * palette.length)];
        gr.addColorStop(0, col);
        gr.addColorStop(0.7, col);
        gr.addColorStop(1, "#b9a29f");
        g.fillStyle = gr;
        g.beginPath();
        g.roundRect(cx + ox - w / 2, cy + oy - h / 2, w, h, h * 0.45);
        g.fill();
      }
    }
  }
  blotches(g, S, rnd, ["#ffffff", "#fbeee8"], 60, 4, 16, 0.18);
  return finish(c);
}

export function snowTexture() {
  const S = 256, rnd = mulberry32(21);
  const { c, g } = canvas(S);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, S, S);
  blotches(g, S, rnd, ["#e8f0ff", "#f6e9f2", "#ffffff"], 60, 12, 46, 0.5);
  return finish(c);
}

export function woodTexture(base = "#b98c63") {
  const S = 256, rnd = mulberry32(31);
  const { c, g } = canvas(S);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 32) {
    g.fillStyle = `rgba(60,30,10,${0.25 + rnd() * 0.15})`;
    g.fillRect(0, y, S, 2);
    for (let k = 0; k < 6; k++) {
      g.strokeStyle = `rgba(80,45,20,${0.08 + rnd() * 0.1})`;
      g.beginPath();
      const yy = y + 4 + rnd() * 24;
      g.moveTo(0, yy);
      g.bezierCurveTo(S * 0.3, yy + rnd() * 4 - 2, S * 0.6, yy + rnd() * 4 - 2, S, yy);
      g.stroke();
    }
  }
  return finish(c);
}

/** Candy-cane stripes (fence rails, posts, awning). */
export function stripeTexture(a = "#c8323c", b = "#fff6ee", n = 8, diagonal = true) {
  const S = 128;
  const { c, g } = canvas(S);
  g.fillStyle = b;
  g.fillRect(0, 0, S, S);
  g.fillStyle = a;
  const w = S / n;
  if (diagonal) {
    for (let i = -n; i < n * 2; i += 2) {
      g.beginPath();
      g.moveTo(i * w, 0);
      g.lineTo((i + 1) * w, 0);
      g.lineTo((i + 1) * w - S, S);
      g.lineTo(i * w - S, S);
      g.fill();
    }
  } else {
    for (let i = 0; i < n; i += 2) g.fillRect(i * w, 0, w, S);
  }
  return finish(c);
}

/** Rocky strata for the island underside (used as vertex-tinted detail). */
export function rockTexture() {
  const S = 256, rnd = mulberry32(41);
  const { c, g } = canvas(S);
  g.fillStyle = "#a79189";
  g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 6 + rnd() * 10) {
    g.fillStyle = `rgba(${90 + rnd() * 40},${70 + rnd() * 30},${70 + rnd() * 30},${0.12 + rnd() * 0.14})`;
    g.fillRect(0, y, S, 3 + rnd() * 6);
  }
  blotches(g, S, rnd, ["#c9b4aa", "#8a7570", "#b49f98"], 90, 4, 22, 0.28);
  return finish(c);
}

/** Needle-ish mottling for pine boughs (tinted by the material colour). */
export function pineTexture() {
  const S = 256, rnd = mulberry32(61);
  const { c, g } = canvas(S);
  g.fillStyle = "#e9efe6";
  g.fillRect(0, 0, S, S);
  blotches(g, S, rnd, ["#ffffff", "#cfe0cc", "#b9d1b8", "#f4f8f1"], 140, 4, 22, 0.4);
  g.lineCap = "round";
  for (let i = 0; i < 700; i++) {
    const x = rnd() * S, y = rnd() * S, a = -Math.PI / 2 + (rnd() - 0.5) * 1.6, l = 6 + rnd() * 10;
    g.strokeStyle = rnd() > 0.5 ? "rgba(255,255,255,0.35)" : "rgba(70,110,80,0.28)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return finish(c);
}

export function glowTexture() {
  const S = 128;
  const { c, g } = canvas(S);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, "rgba(255,226,160,1)");
  gr.addColorStop(0.35, "rgba(255,196,110,0.45)");
  gr.addColorStop(1, "rgba(255,170,80,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return finish(c, false);
}

/** Window pane: warm gradient with a hint of silhouettes/curtains. */
export function windowTexture(curtains = false) {
  const W = 64, H = 96;
  const { c, g } = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#fff0b8");
  gr.addColorStop(0.55, "#ffcf78");
  gr.addColorStop(1, "#f29a4a");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  if (curtains) {
    g.fillStyle = "#8c2f4b";
    g.fillRect(0, 0, 14, H);
    g.fillRect(W - 14, 0, 14, H);
    g.fillStyle = "rgba(0,0,0,0.18)";
    for (let i = 3; i < 14; i += 5) { g.fillRect(i, 0, 1.5, H); g.fillRect(W - i, 0, 1.5, H); }
  } else {
    g.fillStyle = "rgba(120,50,20,0.22)";
    g.beginPath();
    g.ellipse(W * 0.62, H * 0.82, 10, 18, 0, 0, Math.PI * 2);
    g.fill();
  }
  return finish(c, false);
}

export function signTexture(text: string, bg = "#7b2d3b", fg = "#ffe9b0", w = 512, h = 160) {
  const { c, g } = canvas(w, h);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = fg;
  g.lineWidth = 6;
  g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let size = 72;
  g.font = `700 ${size}px "Georgia", "Times New Roman", serif`;
  while (g.measureText(text).width > w - 60 && size > 20) {
    size -= 4;
    g.font = `700 ${size}px "Georgia", serif`;
  }
  g.fillText(text, w / 2, h / 2 + 4);
  return finish(c, false);
}

export function cloudSpriteTexture() {
  const S = 128;
  const { c, g } = canvas(S);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.5, "rgba(255,255,255,0.55)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return finish(c, false);
}
