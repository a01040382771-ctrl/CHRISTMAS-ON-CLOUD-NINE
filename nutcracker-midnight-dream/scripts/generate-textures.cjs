/**
 * Bakes the static paper / watercolour textures once to PNG so the 900-frame
 * render does not pay for SVG turbulence filters on every frame.
 * Usage: node scripts/generate-textures.cjs
 */
const {chromium} = require('playwright');
const path = require('path');

const W = 1080, H = 1920;
const out = (n) => path.join(__dirname, '..', 'public', 'textures', n);

const paper = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="n"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.24  0 0 0 -1.15 0.62"/>
  </filter>
  <filter id="fibers" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03 0.11" numOctaves="2" seed="3"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.25  0 0 0 -2.2 1.05"/>
  </filter>
  <filter id="mottle" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves="4" seed="11"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.5  0 0 0 0 0.36  0 0 0 -1.6 0.95"/>
  </filter>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <rect width="100%" height="100%" filter="url(#mottle)" opacity="0.55"/>
  <rect width="100%" height="100%" filter="url(#fibers)" opacity="0.14"/>
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.5"/>
</svg>`;

// Soft-light watercolour blooms: uneven pigment pooling.
const wash = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <filter id="w" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0028 0.0034" numOctaves="5" seed="23"/>
    <feColorMatrix type="matrix" values="0 0 0 1.1 -0.1  0 0 0 1.1 -0.1  0 0 0 1.1 -0.1  0 0 0 0 1"/>
    <feGaussianBlur stdDeviation="1.2"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#w)"/>
</svg>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: W, height: H}});
  for (const [name, svg] of [['paper.png', paper], ['wash.png', wash]]) {
    await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await p.screenshot({path: out(name), omitBackground: false});
    console.log('wrote', out(name));
  }
  await b.close();
})();
