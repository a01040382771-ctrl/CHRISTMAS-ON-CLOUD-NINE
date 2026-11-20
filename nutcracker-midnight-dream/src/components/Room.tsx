import React, {useMemo} from 'react';
import {C} from '../styles/palette';
import {hair, ink} from './Defs';
import {rnd, range} from '../animations/particles';
import {osc} from '../animations/easing';

/** Victorian damask wallpaper + green wainscot. */
export const Wall: React.FC<{x?: number; y?: number; w: number; h: number; railY: number; tint?: 'night' | 'morning'}> = ({
  x = 0,
  y = 0,
  w,
  h,
  railY,
  tint = 'night',
}) => (
  <g>
    <defs>
      <pattern id="damask" width="150" height="190" patternUnits="userSpaceOnUse">
        <rect width="150" height="190" fill={C.burgundy} />
        <rect x="0" width="6" height="190" fill={C.burgundyDeep} opacity="0.5" />
        <g transform="translate(75 95)" fill="none" stroke={C.gold} strokeWidth="2.2" opacity="0.42" strokeLinecap="round">
          <path d="M 0 -62 C 18 -44 30 -20 0 0 C -30 -20 -18 -44 0 -62 Z" />
          <path d="M 0 0 C 26 12 40 36 22 58 C 10 46 4 30 0 14 C -4 30 -10 46 -22 58 C -40 36 -26 12 0 0 Z" />
          <path d="M -40 -20 C -56 -36 -56 -60 -36 -70 M 40 -20 C 56 -36 56 -60 36 -70" />
          <circle cx="0" cy="-30" r="5" />
          <path d="M -6 70 L 0 82 L 6 70" />
        </g>
        <circle cx="0" cy="0" r="3" fill={C.gold} opacity="0.35" />
        <circle cx="150" cy="0" r="3" fill={C.gold} opacity="0.35" />
        <circle cx="0" cy="190" r="3" fill={C.gold} opacity="0.35" />
        <circle cx="150" cy="190" r="3" fill={C.gold} opacity="0.35" />
      </pattern>
      <linearGradient id="g-wallshade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={tint === 'night' ? '#1D1420' : '#7A5C40'} stopOpacity={tint === 'night' ? 0.55 : 0.12} />
        <stop offset="0.7" stopColor="#1D1420" stopOpacity={tint === 'night' ? 0.1 : 0} />
        <stop offset="1" stopColor="#1D1420" stopOpacity={tint === 'night' ? 0.25 : 0.05} />
      </linearGradient>
    </defs>
    <rect x={x} y={y} width={w} height={railY - y} fill="url(#damask)" />
    {/* wainscot */}
    <rect x={x} y={railY} width={w} height={h - (railY - y)} fill={C.forest} />
    {range(Math.ceil(w / 180)).map((i) => (
      <g key={i}>
        <rect x={x + 22 + i * 180} y={railY + 40} width={136} height={h - (railY - y) - 70} rx={6} fill={C.forestDeep} opacity={0.35} {...ink(2, C.forestDeep)} />
        <rect x={x + 30 + i * 180} y={railY + 48} width={120} height={h - (railY - y) - 86} rx={4} {...hair(1.4, C.forestLight)} />
      </g>
    ))}
    <rect x={x} y={railY - 10} width={w} height={22} fill="url(#g-gold)" {...ink(2)} />
    <rect x={x} y={y} width={w} height={h} fill="url(#g-wallshade)" />
  </g>
);

/** Perspective plank floor with an oriental rug. */
export const Floor: React.FC<{y0: number; y1: number; vpX?: number; vpY?: number; rug?: {cx: number; cy: number; rx: number; ry: number}}> = ({
  y0,
  y1,
  vpX = 540,
  vpY = 600,
  rug,
}) => {
  const lines = useMemo(() => {
    const out: string[] = [];
    for (let k = -14; k <= 26; k++) {
      const bx = -400 + k * 92;
      const t0 = (y0 - vpY) / (y1 - vpY);
      out.push(`M ${vpX + (bx - vpX) * t0} ${y0} L ${bx} ${y1}`);
    }
    // staggered plank ends
    for (let r = 0; r < 9; r++) {
      const yy = y0 + Math.pow((r + 1) / 9, 1.6) * (y1 - y0);
      const t = (yy - vpY) / (y1 - vpY);
      for (let k = -14; k <= 26; k += 2) {
        const bx = -400 + (k + (r % 2)) * 92;
        const x0 = vpX + (bx - vpX) * t;
        const x1 = vpX + (bx + 92 - vpX) * t;
        out.push(`M ${x0} ${yy} L ${x1} ${yy}`);
      }
    }
    return out.join(' ');
  }, [y0, y1, vpX, vpY]);
  return (
    <g>
      <defs>
        <linearGradient id="g-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E4A30" />
          <stop offset="1" stopColor="#9C6E46" />
        </linearGradient>
      </defs>
      <rect x={-600} y={y0} width={2400} height={y1 - y0} fill="url(#g-floor)" />
      <path d={lines} {...hair(1.6, 'rgba(50,30,20,0.45)')} />
      <rect x={-600} y={y0} width={2400} height={16} fill={C.woodDeep} {...ink(2)} />
      {rug && (
        <g>
          <ellipse cx={rug.cx} cy={rug.cy + 8} rx={rug.rx} ry={rug.ry} fill="rgba(40,20,20,0.3)" />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx} ry={rug.ry} fill={C.burgundy} {...ink(2.6)} />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx * 0.93} ry={rug.ry * 0.88} fill="none" {...ink(10, C.gold)} strokeDasharray="3 16" />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx * 0.82} ry={rug.ry * 0.74} fill={C.forest} {...ink(2, C.goldDeep)} />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx * 0.6} ry={rug.ry * 0.52} fill={C.burgundyLight} {...ink(2, C.goldDeep)} />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx * 0.6} ry={rug.ry * 0.52} fill="none" {...ink(3, C.gold)} strokeDasharray="12 10" />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx * 0.36} ry={rug.ry * 0.3} fill={C.forest} {...ink(2, C.goldDeep)} />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx * 0.26} ry={rug.ry * 0.21} fill="none" {...ink(4, C.gold)} strokeDasharray="2 9" />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx * 0.14} ry={rug.ry * 0.12} fill={C.gold} {...ink(2, C.goldDeep)} />
          <ellipse cx={rug.cx} cy={rug.cy} rx={rug.rx * 0.07} ry={rug.ry * 0.07} fill={C.burgundy} {...ink(2, C.goldDeep)} />
        </g>
      )}
    </g>
  );
};

/** Snowy town seen through the window (night) or a pale morning garden. */
const OutsideView: React.FC<{w: number; h: number; f: number; time: 'night' | 'morning'}> = ({w, h, f, time}) => {
  const night = time === 'night';
  const flakes = range(46).map((i) => {
    const sp = rnd(`ws${i}`, 1.2, 2.6);
    const yy = ((rnd(`wy${i}`, 0, h + 40) + f * sp) % (h + 40)) - 20;
    const xx = rnd(`wx${i}`, 0, w) + osc(f + i * 13, 70, 10);
    return <circle key={i} cx={xx} cy={yy} r={rnd(`wr${i}`, 1.6, 4.2)} fill={C.white} opacity={night ? 0.9 : 0.7} />;
  });
  return (
    <g>
      <defs>
        <linearGradient id={`g-sky-${time}`} x1="0" y1="0" x2="0" y2="1">
          {night ? (
            <>
              <stop offset="0" stopColor={C.nightDeep} />
              <stop offset="1" stopColor={C.nightBlue} />
            </>
          ) : (
            <>
              <stop offset="0" stopColor={C.powderLight} />
              <stop offset="0.7" stopColor="#F7E9CB" />
              <stop offset="1" stopColor="#FCE2B0" />
            </>
          )}
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} fill={`url(#g-sky-${time})`} />
      {night && range(18).map((i) => <circle key={i} cx={rnd(`st${i}`, 0, w)} cy={rnd(`sty${i}`, 0, h * 0.45)} r={rnd(`str${i}`, 1, 2.4)} fill="#FFF6DA" opacity={0.5 + osc(f + i * 9, 50, 0.4)} />)}
      {night && <circle cx={w * 0.72} cy={h * 0.18} r={34} fill="#FBF3DD" opacity={0.95} {...ink(1.5, C.powder)} />}
      {night && <circle cx={w * 0.72} cy={h * 0.18} r={70} fill="url(#g-warm)" opacity={0.25} />}
      {/* distant rooftops & church spire */}
      <path
        d={`M 0 ${h * 0.72} L ${w * 0.08} ${h * 0.62} L ${w * 0.18} ${h * 0.7} L ${w * 0.18} ${h * 0.6} L ${w * 0.24} ${h * 0.6} L ${w * 0.24} ${h * 0.66} L ${w * 0.34} ${h * 0.56} L ${w * 0.46} ${h * 0.66} L ${w * 0.52} ${h * 0.4} L ${w * 0.58} ${h * 0.66} L ${w * 0.7} ${h * 0.58} L ${w * 0.82} ${h * 0.68} L ${w * 0.9} ${h * 0.6} L ${w} ${h * 0.7} L ${w} ${h} L 0 ${h} Z`}
        fill={night ? '#34465E' : '#B9CCD8'}
        {...ink(1.6, night ? C.nightDeep : C.powderDeep)}
      />
      <path
        d={`M ${w * 0.02} ${h * 0.715} L ${w * 0.08} ${h * 0.635} L ${w * 0.16} ${h * 0.7} M ${w * 0.26} ${h * 0.64} L ${w * 0.34} ${h * 0.575} L ${w * 0.44} ${h * 0.655} M ${w * 0.62} ${h * 0.64} L ${w * 0.7} ${h * 0.6} L ${w * 0.8} ${h * 0.67}`}
        {...hair(5, C.white)}
      />
      {range(6).map((i) => (
        <rect key={i} x={w * (0.1 + i * 0.15)} y={h * (0.74 + (i % 2) * 0.05)} width={9} height={12} fill={night ? '#F5C978' : '#E8DCC0'} opacity={night ? 0.9 : 0.6} />
      ))}
      <path d={`M 0 ${h * 0.86} Q ${w * 0.5} ${h * 0.8} ${w} ${h * 0.87} L ${w} ${h} L 0 ${h} Z`} fill={night ? '#C7D8E6' : C.white} {...ink(1.4, C.powderDeep)} />
      {flakes}
    </g>
  );
};

/** Arched window with mullions, frosted corners and swaying velvet drapes. */
export const Window: React.FC<{cx: number; top: number; w: number; h: number; f: number; time?: 'night' | 'morning'; breeze?: number}> = ({
  cx,
  top,
  w,
  h,
  f,
  time = 'night',
  breeze = 1,
}) => {
  const x0 = cx - w / 2;
  const r = w / 2;
  const arch = `M ${x0} ${top + r} A ${r} ${r} 0 0 1 ${x0 + w} ${top + r} L ${x0 + w} ${top + h} L ${x0} ${top + h} Z`;
  const sw = osc(f, 96, 1) * breeze;
  const sw2 = osc(f + 30, 120, 1) * breeze;
  const curtain = (side: -1 | 1) => {
    const ex = side < 0 ? x0 - 30 : x0 + w + 30;
    const inner = side < 0 ? x0 + 46 : x0 + w - 46;
    const tie = top + h * 0.55;
    const s = side;
    const sway = (side < 0 ? sw : sw2) * 10;
    return (
      <g>
        <path
          d={`M ${ex - s * 70} ${top - 30} L ${inner + s * 10} ${top - 30} C ${inner + s * 4} ${top + h * 0.25} ${inner - s * 30 + sway * 0.3} ${tie - 40} ${ex + s * 6} ${tie} C ${inner - s * 10 + sway} ${tie + 60} ${inner + s * 20 + sway * 1.6} ${top + h + 40} ${inner + s * 26 + sway * 2} ${top + h + 110} Q ${ex - s * 20 + sway} ${top + h + 130} ${ex - s * 76 + sway * 0.5} ${top + h + 110} Z`}
          fill={C.burgundy}
          {...ink(2.6)}
        />
        <path
          d={`M ${ex - s * 40} ${top - 20} C ${ex - s * 36} ${top + h * 0.3} ${ex - s * 10} ${tie - 30} ${ex + s * 2} ${tie} M ${ex - s * 10} ${tie + 10} C ${ex - s * 6 + sway} ${tie + 120} ${ex - s * 10 + sway * 1.4} ${top + h} ${ex - s * 20 + sway * 1.8} ${top + h + 116} M ${ex - s * 50} ${tie + 10} C ${ex - s * 46 + sway * 0.6} ${tie + 120} ${ex - s * 50 + sway} ${top + h} ${ex - s * 56 + sway * 1.2} ${top + h + 114} M ${inner - s * 6} ${top} C ${inner - s * 12} ${top + h * 0.25} ${inner - s * 30} ${tie - 50} ${ex + s * 20} ${tie - 8}`}
          {...hair(2.2, C.burgundyDeep)}
        />
        <path d={`M ${ex - s * 54} ${top} C ${ex - s * 52} ${tie - 80} ${ex - s * 30} ${tie - 20} ${ex - s * 26} ${tie}`} {...hair(3, 'rgba(255,220,220,0.18)')} />
        {/* tie-back cord & tassel */}
        <path d={`M ${ex - s * 70} ${tie - 6} Q ${ex - s * 20} ${tie + 18} ${ex + s * 16} ${tie - 2}`} fill="none" {...ink(5, C.gold)} />
        <g transform={`translate(${ex + s * 16} ${tie}) rotate(${sway * 0.8})`}>
          <circle r={7} fill="url(#g-gold)" {...ink(1.4)} />
          <path d="M -7 4 L -10 34 L 10 34 L 7 4 Z" fill="url(#g-gold)" {...ink(1.6)} />
          <path d="M -6 12 L -7 32 M 0 12 L 0 33 M 6 12 L 7 32" {...hair(1, C.goldDeep)} />
        </g>
      </g>
    );
  };
  return (
    <g>
      <defs>
        <clipPath id={`win-${time}`}>
          <path d={arch} />
        </clipPath>
      </defs>
      {/* frame */}
      <path d={`M ${x0 - 26} ${top + r} A ${r + 26} ${r + 26} 0 0 1 ${x0 + w + 26} ${top + r} L ${x0 + w + 26} ${top + h + 20} L ${x0 - 26} ${top + h + 20} Z`} fill={C.ivoryDeep} {...ink(2.6)} />
      <g clipPath={`url(#win-${time})`}>
        <g transform={`translate(${x0} ${top})`}>
          <OutsideView w={w} h={h} f={f} time={time} />
        </g>
        {/* frost */}
        <path d={`M ${x0} ${top + h} q 30 -40 0 -80 M ${x0 + w} ${top + h} q -36 -30 0 -90`} fill="none" {...ink(30, 'rgba(255,255,255,0.35)')} />
      </g>
      <path d={arch} fill="none" {...ink(10, C.ivory)} />
      <path d={arch} fill="none" {...ink(2.4)} />
      {/* mullions */}
      <path d={`M ${cx} ${top} L ${cx} ${top + h} M ${x0} ${top + r} L ${x0 + w} ${top + r} M ${x0} ${top + r + (h - r) / 2} L ${x0 + w} ${top + r + (h - r) / 2}`} {...ink(9, C.ivory)} />
      <path d={`M ${cx} ${top} L ${cx} ${top + h} M ${x0} ${top + r} L ${x0 + w} ${top + r} M ${x0} ${top + r + (h - r) / 2} L ${x0 + w} ${top + r + (h - r) / 2}`} {...hair(1.4, C.inkSoft)} />
      {/* sill */}
      <path d={`M ${x0 - 44} ${top + h + 14} L ${x0 + w + 44} ${top + h + 14} L ${x0 + w + 34} ${top + h + 40} L ${x0 - 34} ${top + h + 40} Z`} fill={C.ivory} {...ink(2.4)} />
      {curtain(-1)}
      {curtain(1)}
      {/* valance with gold fringe */}
      <path
        d={`M ${x0 - 120} ${top - 54} L ${x0 + w + 120} ${top - 54} L ${x0 + w + 120} ${top + 20} Q ${x0 + w + 60} ${top + 60} ${cx + w * 0.18} ${top + 22} Q ${cx} ${top + 64} ${cx - w * 0.18} ${top + 22} Q ${x0 - 60} ${top + 60} ${x0 - 120} ${top + 20} Z`}
        fill={C.burgundy}
        {...ink(2.6)}
      />
      <path
        d={`M ${x0 - 120} ${top + 26} Q ${x0 - 60} ${top + 66} ${cx - w * 0.18} ${top + 28} Q ${cx} ${top + 70} ${cx + w * 0.18} ${top + 28} Q ${x0 + w + 60} ${top + 66} ${x0 + w + 120} ${top + 26}`}
        fill="none"
        {...ink(7, C.gold)}
        strokeDasharray="2 7"
      />
      <rect x={x0 - 130} y={top - 64} width={w + 260} height={16} rx={6} fill="url(#g-gold)" {...ink(2)} />
    </g>
  );
};

/** Animated flame tongue. */
const Flame: React.FC<{x: number; s: number; f: number; ph: number}> = ({x, s, f, ph}) => {
  const a = osc(f + ph * 20, 13 + ph * 3, 1);
  const b = osc(f + ph * 31, 9 + ph * 2, 1);
  const hgt = 70 + a * 12 + b * 6;
  return (
    <path
      transform={`translate(${x} 0) scale(${s})`}
      d={`M -26 0 C -30 -24 ${-12 + b * 6} ${-hgt * 0.55} ${a * 8} ${-hgt} C ${10 + b * 4} ${-hgt * 0.6} 34 -30 26 0 Z`}
      fill="url(#g-flame)"
      {...ink(1.4, '#B8582E')}
    />
  );
};

/** Carved ivory fireplace with a living fire and hanging stockings. Origin = hearth centre on the floor. */
export const Fireplace: React.FC<{f: number; lit?: number}> = ({f, lit = 1}) => {
  const glow = 0.75 + osc(f, 11, 0.12) + osc(f + 7, 5, 0.06);
  return (
    <g>
      {/* glow on wall */}
      {lit > 0 && <ellipse cx={0} cy={-150} rx={360} ry={260} fill="url(#g-warm)" opacity={0.5 * glow * lit} />}
      {/* chimney breast */}
      <rect x={-220} y={-470} width={440} height={470} fill={C.ivoryDeep} {...ink(2.6)} />
      {/* columns */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * 190 - 26} y={-440} width={52} height={430} fill={C.ivory} {...ink(2.2)} />
          <path d={`M ${s * 190 - 12} -420 L ${s * 190 - 12} -30 M ${s * 190} -420 L ${s * 190} -30 M ${s * 190 + 12} -420 L ${s * 190 + 12} -30`} {...hair(1.3)} />
          <rect x={s * 190 - 32} y={-60} width={64} height={60} fill={C.ivoryDeep} {...ink(2.2)} />
        </g>
      ))}
      {/* tile surround */}
      <rect x={-160} y={-380} width={320} height={380} fill={C.forest} {...ink(2.2)} />
      <path d="M -160 -340 L 160 -340 M -160 -300 L 160 -300 M -120 -380 L -120 -270 M 120 -380 L 120 -270 M -80 -380 L -80 -300 M 80 -380 L 80 -300 M -40 -380 L -40 -340 M 0 -380 L 0 -340 M 40 -380 L 40 -340" {...hair(1.2, C.forestLight)} />
      {/* firebox */}
      <path d="M -120 0 L -120 -200 Q 0 -290 120 -200 L 120 0 Z" fill="#2A1C19" {...ink(2.6)} />
      <path d="M -120 0 L -120 -200 Q 0 -290 120 -200 L 120 0" fill="none" {...ink(10, C.goldDeep)} />
      <ellipse cx={0} cy={-50} rx={130} ry={80} fill="url(#g-warm)" opacity={glow * lit} />
      {/* logs */}
      <path d="M -90 -18 L 70 -46 L 78 -24 L -84 4 Z" fill={C.woodDeep} {...ink(2)} />
      <path d="M -70 -46 L 90 -14 L 84 8 L -78 -22 Z" fill="#6B4528" {...ink(2)} />
      <ellipse cx={86} cy={-2} rx={8} ry={11} fill={C.woodLight} {...ink(1.6)} />
      {lit > 0 && (
        <g opacity={lit} transform="translate(0 -28)">
          <Flame x={-48} s={0.85} f={f} ph={0.1} />
          <Flame x={42} s={0.9} f={f} ph={0.6} />
          <Flame x={0} s={1.25} f={f} ph={0.35} />
          <Flame x={-18} s={0.7} f={f} ph={0.9} />
          <Flame x={22} s={0.65} f={f} ph={1.2} />
          {range(6).map((i) => {
            const t = ((f + i * 17) % 60) / 60;
            return <circle key={i} cx={rnd(`em${i}`, -50, 50) + Math.sin(t * 6 + i) * 10} cy={-60 - t * 180} r={2.4 * (1 - t)} fill="#FFD27A" opacity={1 - t} />;
          })}
        </g>
      )}
      {lit === 0 && <path d="M -60 -24 Q -20 -40 20 -28 Q 50 -36 70 -24" {...hair(6, 'rgba(230,120,60,0.5)')} />}
      {/* brass fender */}
      <path d="M -150 0 L -150 -30 Q 0 -44 150 -30 L 150 0" fill="none" {...ink(5, C.gold)} />
      <path d="M -150 -30 Q 0 -44 150 -30" fill="none" {...ink(2.2)} />
      {range(9).map((i) => (
        <path key={i} d={`M ${-140 + i * 35} -32 L ${-140 + i * 35} 0`} {...ink(2.6, C.goldDeep)} />
      ))}
      {/* mantel shelf */}
      <path d="M -260 -470 L 260 -470 L 248 -440 L -248 -440 Z" fill={C.ivory} {...ink(2.6)} />
      <rect x={-262} y={-490} width={524} height={22} rx={3} fill={C.white} {...ink(2.4)} />
      <path d="M -240 -456 L 240 -456" {...ink(2, C.gold)} strokeDasharray="10 6" />
      {/* evergreen garland on the mantel */}
      <path d="M -250 -486 Q -125 -430 0 -480 Q 125 -430 250 -486" fill="none" {...ink(18, C.forest)} />
      <path d="M -250 -486 Q -125 -430 0 -480 Q 125 -430 250 -486" fill="none" {...ink(5, C.forestLight)} strokeDasharray="3 9" />
      {[-250, 0, 250].map((x) => (
        <g key={x} transform={`translate(${x} -484)`}>
          <path d="M 0 0 C -14 -14 -26 -2 -18 6 C -10 12 -4 4 0 0 Z M 0 0 C 14 -14 26 -2 18 6 C 10 12 4 4 0 0 Z" fill="url(#g-ribbon)" {...ink(1.6)} />
          <circle r={4} fill={C.ribbon} />
        </g>
      ))}
      {/* stockings */}
      {[
        {x: -110, c: C.burgundyLight, ph: 0},
        {x: 110, c: C.forestLight, ph: 1.4},
      ].map((s) => (
        <g key={s.x} transform={`translate(${s.x} -446) rotate(${osc(f + s.ph * 30, 110, 2.2)})`}>
          <path d="M -22 0 L 22 0 L 22 92 C 22 112 6 120 -14 120 L -46 120 C -64 120 -66 96 -48 94 L -22 92 Z" fill={s.c} {...ink(2.4)} />
          <path d="M -22 36 L 22 30 M -22 62 L 22 56" {...hair(2, 'rgba(255,240,220,0.5)')} strokeDasharray="4 5" />
          <rect x={-28} y={-6} width={56} height={30} rx={8} fill={C.white} {...ink(2.2)} />
          <path d="M -46 120 C -60 118 -62 100 -48 96" fill="none" {...ink(6, C.white)} />
        </g>
      ))}
    </g>
  );
};

/** Ornate mantel clock. `minutes` = minutes past 11:00 (60 = midnight). Origin = bottom centre. */
export const MantelClock: React.FC<{f: number; minutes: number; scale?: number}> = ({f, minutes, scale = 1}) => {
  const m = minutes % 60;
  const hourAngle = ((11 + minutes / 60) % 12) * 30;
  const minAngle = m * 6;
  const pend = osc(f, 30, 14);
  return (
    <g transform={`scale(${scale})`}>
      {/* plinth */}
      <path d="M -88 0 L 88 0 L 78 -24 L -78 -24 Z" fill="url(#g-gold)" {...ink(2.2)} />
      {[-62, 62].map((x) => (
        <circle key={x} cx={x} cy={-4} r={9} fill="url(#g-ball-gold)" {...ink(1.6)} />
      ))}
      {/* case */}
      <path d="M -70 -24 L -70 -170 C -70 -236 70 -236 70 -170 L 70 -24 Z" fill={C.woodDeep} {...ink(2.6)} />
      <path d="M -58 -30 L -58 -168 C -58 -222 58 -222 58 -168 L 58 -30 Z" fill="none" {...ink(3, C.gold)} />
      {/* pendulum window */}
      <rect x={-30} y={-92} width={60} height={56} rx={6} fill="#2B1F1C" {...ink(2)} />
      <g transform={`translate(0 -92) rotate(${pend})`}>
        <path d="M 0 0 L 0 38" {...ink(2.4, C.gold)} />
        <circle cx={0} cy={42} r={9} fill="url(#g-ball-gold)" {...ink(1.4)} />
      </g>
      <rect x={-30} y={-92} width={60} height={56} rx={6} fill="none" {...ink(3, C.gold)} />
      {/* dial */}
      <circle cx={0} cy={-158} r={52} fill="url(#g-gold)" {...ink(2.2)} />
      <circle cx={0} cy={-158} r={44} fill={C.white} {...ink(1.8)} />
      {range(12).map((i) => {
        const a = (i / 12) * Math.PI * 2;
        const big = i % 3 === 0;
        return (
          <path
            key={i}
            d={`M ${Math.sin(a) * (big ? 30 : 34)} ${-158 - Math.cos(a) * (big ? 30 : 34)} L ${Math.sin(a) * 40} ${-158 - Math.cos(a) * 40}`}
            {...ink(big ? 3.4 : 1.8)}
          />
        );
      })}
      <g transform={`translate(0 -158) rotate(${hourAngle})`}>
        <path d="M -3 4 L 0 -24 L 3 4 Z" fill={C.ink} {...ink(1.6)} />
      </g>
      <g transform={`translate(0 -158) rotate(${minAngle})`}>
        <path d="M -2 6 L 0 -36 L 2 6 Z" fill={C.ink} {...ink(1.2)} />
      </g>
      <circle cx={0} cy={-158} r={4} fill={C.gold} {...ink(1.2)} />
      {/* finial */}
      <path d="M -10 -214 Q 0 -246 10 -214 Z" fill="url(#g-gold)" {...ink(1.8)} />
      <circle cx={0} cy={-246} r={7} fill="url(#g-ball-gold)" {...ink(1.4)} />
      {/* scrolls */}
      <path d="M -70 -60 C -96 -66 -96 -96 -76 -98 M 70 -60 C 96 -66 96 -96 76 -98" fill="none" {...ink(5, C.gold)} />
    </g>
  );
};

/** Wrapped gift drawn in soft 2.5D. Origin = bottom centre of front face. */
export const GiftBox: React.FC<{w: number; h: number; d?: number; color: string; band: string; lid?: number; lidSpin?: number}> = ({
  w,
  h,
  d = 0.45,
  color,
  band,
  lid = 0,
  lidSpin = 0,
}) => {
  const dz = w * d * 0.5;
  const lidH = h * 0.2;
  return (
    <g>
      <ellipse cx={dz * 0.4} cy={2} rx={w * 0.62} ry={10} fill="rgba(30,15,10,0.28)" />
      {/* body side + front */}
      <path d={`M ${w / 2} 0 L ${w / 2 + dz} ${-dz * 0.6} L ${w / 2 + dz} ${-h - dz * 0.6} L ${w / 2} ${-h} Z`} fill={color} {...ink(2.2)} />
      <path d={`M ${w / 2} 0 L ${w / 2 + dz} ${-dz * 0.6} L ${w / 2 + dz} ${-h - dz * 0.6} L ${w / 2} ${-h} Z`} fill="rgba(0,0,0,0.22)" />
      <rect x={-w / 2} y={-h} width={w} height={h} fill={color} {...ink(2.4)} />
      <rect x={-w * 0.08} y={-h} width={w * 0.16} height={h} fill={band} {...ink(1.8)} />
      <path d={`M ${w / 2 + dz * 0.45} ${-dz * 0.27} L ${w / 2 + dz * 0.45} ${-h - dz * 0.27}`} {...ink(w * 0.1, band)} />
      {/* opening glow */}
      {lid > 0.05 && <ellipse cx={dz * 0.5} cy={-h - dz * 0.3} rx={w * 0.55} ry={dz * 0.5 + 10} fill="url(#g-magic)" opacity={Math.min(1, lid * 1.4)} />}
      {/* lid */}
      <g transform={`translate(${lid * w * 0.35} ${-lid * h * 0.9}) rotate(${lid * lidSpin} ${0} ${-h})`}>
        <path d={`M ${-w / 2 - 6} ${-h} L ${-w / 2 - 6 + dz} ${-h - dz * 0.6} L ${w / 2 + 6 + dz} ${-h - dz * 0.6} L ${w / 2 + 6} ${-h} Z`} fill={color} {...ink(2.2)} />
        <path d={`M ${-w / 2 - 6} ${-h} L ${-w / 2 - 6 + dz} ${-h - dz * 0.6} L ${w / 2 + 6 + dz} ${-h - dz * 0.6} L ${w / 2 + 6} ${-h} Z`} fill="rgba(255,255,255,0.12)" />
        <rect x={-w / 2 - 6} y={-h} width={w + 12} height={lidH} fill={color} {...ink(2.2)} />
        <rect x={-w * 0.08} y={-h} width={w * 0.16} height={lidH} fill={band} {...ink(1.6)} />
        <path d={`M ${-w * 0.0 + dz * 0.5 - w * 0.5} ${-h - dz * 0.3} L ${w * 0.5 + dz * 0.5} ${-h - dz * 0.3} M ${dz * 0.5} ${-h - dz * 0.6 + 2} L 0 ${-h}`} {...ink(w * 0.08, band)} />
        <g transform={`translate(${dz * 0.5} ${-h - dz * 0.3})`}>
          <path d={`M 0 0 C ${-w * 0.2} ${-w * 0.22} ${-w * 0.36} ${-w * 0.04} ${-w * 0.24} ${w * 0.04} C ${-w * 0.14} ${w * 0.1} -6 4 0 0 Z`} fill={band} {...ink(2)} />
          <path d={`M 0 0 C ${w * 0.2} ${-w * 0.22} ${w * 0.36} ${-w * 0.04} ${w * 0.24} ${w * 0.04} C ${w * 0.14} ${w * 0.1} 6 4 0 0 Z`} fill={band} {...ink(2)} />
          <circle r={w * 0.05} fill={band} {...ink(1.6)} />
        </g>
      </g>
    </g>
  );
};
