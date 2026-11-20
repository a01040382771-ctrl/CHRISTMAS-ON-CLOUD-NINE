import React from 'react';
import {C} from '../styles/palette';

/** Common stroke presets — sepia ink, never pure black. */
export const ink = (w = 2.6, color: string = C.ink) =>
  ({
    stroke: color,
    strokeWidth: w,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  }) as const;

export const hair = (w = 1.3, color: string = C.inkSoft) => ({...ink(w, color), fill: 'none'});

/**
 * Global <defs> shared by every scene (gradients, patterns, filters).
 * Rendered once in a zero-size SVG; other inline SVGs reference by id.
 */
export const GlobalDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      {/* Hand-drawn line wobble: static noise (no "boiling" between frames). */}
      <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <filter id="blur4" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <filter id="blur10" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
      <filter id="blur24" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="24" />
      </filter>

      {/* --- character fills --- */}
      <radialGradient id="g-skin" cx="45%" cy="40%" r="65%">
        <stop offset="0" stopColor="#F8E2CE" />
        <stop offset="0.7" stopColor={C.skin} />
        <stop offset="1" stopColor={C.skinShade} />
      </radialGradient>
      <radialGradient id="g-cheek" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor={C.cheek} stopOpacity="0.75" />
        <stop offset="1" stopColor={C.cheek} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="g-hair" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor={C.hairLight} />
        <stop offset="0.5" stopColor={C.hair} />
        <stop offset="1" stopColor={C.hairDeep} />
      </linearGradient>
      <linearGradient id="g-gown" x1="0" y1="0" x2="1" y2="0.25">
        <stop offset="0" stopColor={C.white} />
        <stop offset="0.55" stopColor={C.ivory} />
        <stop offset="1" stopColor={C.ivoryDeep} />
      </linearGradient>
      <linearGradient id="g-ribbon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#B8454F" />
        <stop offset="1" stopColor={C.ribbonDeep} />
      </linearGradient>
      <linearGradient id="g-coat" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#B04452" />
        <stop offset="0.6" stopColor={C.coat} />
        <stop offset="1" stopColor={C.coatDeep} />
      </linearGradient>
      <linearGradient id="g-navy" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3D4B70" />
        <stop offset="0.6" stopColor={C.navy} />
        <stop offset="1" stopColor={C.navyDeep} />
      </linearGradient>
      <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.goldLight} />
        <stop offset="0.5" stopColor={C.gold} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
      <linearGradient id="g-wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={C.woodLight} />
        <stop offset="0.6" stopColor={C.wood} />
        <stop offset="1" stopColor={C.woodDeep} />
      </linearGradient>
      <radialGradient id="g-woodface" cx="45%" cy="38%" r="70%">
        <stop offset="0" stopColor="#F6DCC2" />
        <stop offset="0.75" stopColor="#EBC4A2" />
        <stop offset="1" stopColor="#D7A782" />
      </radialGradient>
      <linearGradient id="g-white" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={C.white} />
        <stop offset="1" stopColor={C.ivoryDeep} />
      </linearGradient>
      <linearGradient id="g-green" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={C.forestLight} />
        <stop offset="0.6" stopColor={C.forest} />
        <stop offset="1" stopColor={C.forestDeep} />
      </linearGradient>
      <linearGradient id="g-boot" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4A3B33" />
        <stop offset="1" stopColor={C.boot} />
      </linearGradient>

      {/* --- light --- */}
      <radialGradient id="g-warm" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#FFE3A6" stopOpacity="0.9" />
        <stop offset="0.45" stopColor="#F4C07A" stopOpacity="0.35" />
        <stop offset="1" stopColor="#F4C07A" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="g-magic" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#FFF6DA" stopOpacity="1" />
        <stop offset="0.35" stopColor={C.goldLight} stopOpacity="0.7" />
        <stop offset="1" stopColor={C.gold} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="g-ball-gold" cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="#FFF4D2" />
        <stop offset="0.35" stopColor={C.goldLight} />
        <stop offset="1" stopColor={C.goldDeep} />
      </radialGradient>
      <radialGradient id="g-ball-red" cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="#E7A3A8" />
        <stop offset="0.4" stopColor={C.burgundyLight} />
        <stop offset="1" stopColor={C.burgundyDeep} />
      </radialGradient>
      <radialGradient id="g-ball-blue" cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="#F2F7FA" />
        <stop offset="0.4" stopColor={C.powder} />
        <stop offset="1" stopColor={C.powderDeep} />
      </radialGradient>
      <radialGradient id="g-flame" cx="50%" cy="70%" r="60%">
        <stop offset="0" stopColor="#FFF7DC" />
        <stop offset="0.45" stopColor="#F7C76B" />
        <stop offset="1" stopColor="#D9733F" />
      </radialGradient>
    </defs>
  </svg>
);
