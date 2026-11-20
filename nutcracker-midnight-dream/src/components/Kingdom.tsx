import React from 'react';
import {C} from '../styles/palette';
import {hair, ink} from './Defs';
import {range, rnd} from '../animations/particles';

/** Icing drips along a horizontal edge. */
const drips = (x0: number, x1: number, y: number, n: number, seed: string, depth = 18) => {
  let d = `M ${x0} ${y - 6}`;
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n;
    const b = x0 + ((x1 - x0) * (i + 1)) / n;
    const m = (a + b) / 2;
    const dd = rnd(`${seed}${i}`, depth * 0.4, depth);
    d += ` L ${a} ${y} Q ${a + 2} ${y + dd} ${m} ${y + dd} Q ${b - 2} ${y + dd} ${b} ${y}`;
  }
  return d + ` L ${x1} ${y - 6} Z`;
};

/** Twisted blue sugar tower with a meringue cap. Origin = base centre. */
export const SugarTower: React.FC<{h: number; w: number; f: number; tone?: 'blue' | 'rose'; seed: string}> = ({h, w, f, tone = 'blue', seed}) => {
  const main = tone === 'blue' ? C.powder : C.rose;
  const deep = tone === 'blue' ? C.powderDeep : C.roseDeep;
  const stripes = range(Math.round(h / 40)).map((i) => {
    const y = -i * 40;
    return `M ${-w / 2} ${y} Q 0 ${y - 30} ${w / 2} ${y - 46}`;
  });
  return (
    <g>
      <path d={`M ${-w / 2} 0 L ${-w * 0.4} ${-h} L ${w * 0.4} ${-h} L ${w / 2} 0 Z`} fill={main} {...ink(2.2)} />
      <path d={stripes.join(' ')} {...hair(7, C.white)} opacity={0.8} />
      <path d={stripes.join(' ')} {...hair(1.4, deep)} transform="translate(0 6)" />
      <path d={drips(-w * 0.46, w * 0.46, -h + 4, 5, seed + 'd', 22)} fill={C.white} {...ink(1.8)} />
      <path d={`M ${-w * 0.55} ${-h} Q ${-w * 0.5} ${-h - w * 0.9} 0 ${-h - w * 1.3} Q ${w * 0.5} ${-h - w * 0.9} ${w * 0.55} ${-h} Z`} fill={C.white} {...ink(2.2)} />
      <path d={`M ${-w * 0.3} ${-h - w * 0.2} Q 0 ${-h - w * 0.5} ${w * 0.3} ${-h - w * 0.25}`} {...hair(1.4, deep)} />
      <path d={`M 0 ${-h - w * 1.3} L 0 ${-h - w * 1.3 - 34}`} {...ink(2.4, C.goldDeep)} />
      <circle cx={0} cy={-h - w * 1.3 - 40} r={8} fill="url(#g-ball-gold)" {...ink(1.4)} />
      <circle cx={0} cy={-h - w * 1.3 - 40} r={22} fill="url(#g-magic)" opacity={0.5 + Math.sin(f / 9 + h) * 0.3} />
      {range(3).map((i) => (
        <path key={i} d={`M -8 ${-h * (0.25 + i * 0.22)} L -8 ${-h * (0.25 + i * 0.22) - 22} A 8 8 0 0 1 8 ${-h * (0.25 + i * 0.22) - 22} L 8 ${-h * (0.25 + i * 0.22)} Z`} fill="#FFE6A8" {...ink(1.6)} />
      ))}
    </g>
  );
};

/** Candy cloud puff. */
export const CandyCloud: React.FC<{w: number; color?: string}> = ({w, color = C.roseLight}) => (
  <g>
    <path
      d={`M ${-w / 2} 0 C ${-w / 2 - 20} ${-w * 0.2} ${-w * 0.3} ${-w * 0.32} ${-w * 0.18} ${-w * 0.22} C ${-w * 0.14} ${-w * 0.46} ${w * 0.12} ${-w * 0.46} ${w * 0.14} ${-w * 0.26} C ${w * 0.3} ${-w * 0.36} ${w * 0.52} ${-w * 0.2} ${w / 2} 0 Z`}
      fill={color}
      {...ink(2, C.roseDeep)}
    />
    <path d={`M ${-w * 0.3} ${-w * 0.08} Q 0 ${-w * 0.02} ${w * 0.32} ${-w * 0.08}`} {...hair(1.4, 'rgba(255,255,255,0.8)')} />
  </g>
);

/** The pink confectionery palace. Origin = centre of the bottom step. ~900 wide. */
export const SugarPalace: React.FC<{f: number}> = ({f}) => {
  const glow = 0.75 + Math.sin(f / 14) * 0.15;
  const sideTower = (x: number, s: number) => (
    <g transform={`translate(${x} -300)`}>
      <rect x={-60} y={-360} width={120} height={360} fill={C.rose} {...ink(2.4)} />
      <path d="M -60 -260 L 60 -260 M -60 -150 L 60 -150" {...ink(8, C.white)} />
      <path d={drips(-62, 62, -360, 6, `st${s}`, 26)} fill={C.white} {...ink(1.8)} />
      <path d="M -74 -366 Q -70 -470 0 -560 Q 70 -470 74 -366 Z" fill={C.powder} {...ink(2.4)} />
      <path d="M -50 -400 Q 0 -440 50 -400 M -30 -470 Q 0 -500 30 -470" {...hair(5, C.white)} />
      <path d="M 0 -560 L 0 -620" {...ink(2.4, C.goldDeep)} />
      <path d={`M 0 -620 Q 20 ${-626 + Math.sin(f / 6 + s) * 5} 44 ${-616 + Math.sin(f / 6 + s + 1) * 6} L 0 -598 Z`} fill={C.gold} {...ink(1.6)} />
      {[-200, -100].map((y) => (
        <g key={y}>
          <path d={`M -18 ${y + 40} L -18 ${y} A 18 18 0 0 1 18 ${y} L 18 ${y + 40} Z`} fill="#FFE2A0" opacity={glow} {...ink(2)} />
          <path d={`M -18 ${y + 40} L -18 ${y} A 18 18 0 0 1 18 ${y} L 18 ${y + 40}`} fill="none" {...ink(4, C.gold)} />
        </g>
      ))}
    </g>
  );
  return (
    <g>
      <ellipse cx={0} cy={-520} rx={620} ry={560} fill="url(#g-warm)" opacity={0.45 * glow} />
      {sideTower(-330, 1)}
      {sideTower(330, 2)}
      {/* main hall */}
      <rect x={-270} y={-620} width={540} height={460} fill={C.roseLight} {...ink(2.6)} />
      {range(6).map((i) => (
        <rect key={i} x={-270 + i * 90 + 30} y={-620} width={30} height={460} fill={C.rose} opacity={0.7} />
      ))}
      <path d={drips(-275, 275, -620, 12, 'mh', 30)} fill={C.white} {...ink(2)} />
      {/* candy-cane columns */}
      {[-230, -120, 120, 230].map((x) => (
        <g key={x}>
          <rect x={x - 16} y={-560} width={32} height={400} fill={C.white} {...ink(2)} />
          <path d={range(10).map((k) => `M ${x - 16} ${-540 + k * 40} L ${x + 16} ${-560 + k * 40}`).join(' ')} {...ink(9, C.burgundyLight)} />
          <rect x={x - 22} y={-580} width={44} height={22} fill="url(#g-gold)" {...ink(1.6)} />
        </g>
      ))}
      {/* great arched door */}
      <path d="M -80 -160 L -80 -390 A 80 80 0 0 1 80 -390 L 80 -160 Z" fill="#FFE7AE" opacity={glow} {...ink(2.4)} />
      <path d="M -80 -160 L -80 -390 A 80 80 0 0 1 80 -390 L 80 -160" fill="none" {...ink(8, C.gold)} />
      <ellipse cx={0} cy={-300} rx={140} ry={160} fill="url(#g-magic)" opacity={0.45 * glow} />
      {/* main dome — a frosted cupcake crown */}
      <path d="M -230 -620 Q -240 -860 0 -960 Q 240 -860 230 -620 Z" fill={C.rose} {...ink(2.6)} />
      <path d="M -170 -640 Q -150 -840 0 -940 M -80 -630 Q -70 -860 0 -950 M 80 -630 Q 70 -860 0 -950 M 170 -640 Q 150 -840 0 -940" {...hair(3, C.roseDeep)} />
      <path d={drips(-236, 236, -640, 10, 'dm', 34)} fill={C.white} {...ink(2)} />
      {range(9).map((i) => (
        <circle key={i} cx={-200 + i * 50} cy={-700 - Math.sin((i / 8) * Math.PI) * 60} r={7} fill={[C.powder, C.gold, C.white][i % 3]} {...ink(1.2)} />
      ))}
      <path d="M -40 -950 Q 0 -1010 40 -950 Z" fill={C.powder} {...ink(2)} />
      <path d="M 0 -1000 L 0 -1080" {...ink(3, C.goldDeep)} />
      <g transform={`translate(0 -1100) rotate(${f * 0.8})`}>
        <circle r={70} fill="url(#g-magic)" opacity={0.7} />
        <path
          d={range(16).map((k) => {
            const a = (k / 16) * Math.PI * 2;
            const r = k % 2 ? 12 : 32;
            return `${k ? 'L' : 'M'} ${Math.cos(a) * r} ${Math.sin(a) * r}`;
          }).join(' ') + ' Z'}
          fill="url(#g-ball-gold)"
          {...ink(1.8)}
        />
      </g>
      {/* grand staircase */}
      {range(5).map((i) => (
        <path key={i} d={`M ${-180 - i * 40} ${-160 + i * 32} L ${180 + i * 40} ${-160 + i * 32} L ${190 + i * 44} ${-128 + i * 32} L ${-190 - i * 44} ${-128 + i * 32} Z`} fill={i % 2 ? C.white : C.roseLight} {...ink(2)} />
      ))}
    </g>
  );
};

/**
 * Ballerina in a pirouette. `ph` = turn angle (rad). Origin = pointe toe.
 * The 3/4 turn is suggested by sliding the face, squeezing the torso and
 * swapping the raised (passé) knee side — never by flat scaling of the whole figure.
 */
export const Ballerina: React.FC<{ph: number; tutu?: string; tutuDeep?: string; hairColor?: string}> = ({
  ph,
  tutu = C.powder,
  tutuDeep = C.powderDeep,
  hairColor = C.hairDeep,
}) => {
  const c = Math.cos(ph);
  const s = Math.sin(ph);
  const squeeze = 0.78 + 0.22 * Math.abs(c);
  const knee = 70 * c;
  const facing = Math.max(0, Math.min(1, c * 1.6 + 0.5));
  const scallops = range(14)
    .map((i) => {
      const a = (i / 14) * Math.PI * 2 + ph;
      const x = Math.cos(a) * 128;
      const y = Math.sin(a) * 26;
      return {x, y, front: Math.sin(a) > 0};
    })
    .sort((a, b) => a.y - b.y);
  return (
    <g>
      <ellipse cx={0} cy={4} rx={60} ry={10} fill="rgba(120,60,80,0.25)" />
      {/* standing leg on pointe */}
      <path d="M -7 -190 L -6 -20 L 6 -20 L 9 -190 Z" fill="#F6D9D2" {...ink(2)} />
      <path d="M -6 -22 L -5 0 L 5 0 L 6 -22 Z" fill={C.roseDeep} {...ink(1.8)} />
      <path d="M -6 -40 L 6 -30 M 6 -40 L -6 -30" {...hair(1.4, C.roseDeep)} />
      {/* passé leg */}
      <path d={`M 2 -186 L ${knee} -130 L 4 -110`} fill="none" {...ink(13, C.ink)} />
      <path d={`M 2 -186 L ${knee} -130 L 4 -110`} fill="none" stroke="#F6D9D2" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      {/* tutu: layered net with turning scallops */}
      <g transform="translate(0 -196)">
        <ellipse rx={132} ry={30} fill={tutuDeep} {...ink(2.2)} />
        {scallops.map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={26} ry={12} fill={p.front ? tutu : tutuDeep} {...ink(1.4)} />
        ))}
        <ellipse rx={92} ry={20} fill={tutu} {...ink(1.8)} />
        <path d={`M -80 2 Q 0 ${16} 80 2`} {...hair(1.4, C.white)} />
        {range(5).map((i) => (
          <circle key={i} cx={Math.cos(ph + i * 1.26) * 70} cy={Math.sin(ph + i * 1.26) * 14} r={3} fill={C.goldLight} />
        ))}
      </g>
      {/* bodice */}
      <g transform={`translate(0 -200) scale(${squeeze} 1)`}>
        <path d="M -20 0 C -24 -40 -30 -80 -26 -100 Q 0 -110 26 -100 C 30 -80 24 -40 20 0 Z" fill={tutu} {...ink(2.2)} />
        <path d="M -24 -94 Q 0 -86 24 -94 M -12 -10 L 0 -40 L 12 -10" {...hair(1.6, C.goldDeep)} />
      </g>
      {/* arms en couronne */}
      <g transform={`translate(0 -298) scale(${0.65 + 0.35 * Math.abs(c)} 1)`}>
        <path d="M -24 4 C -70 -20 -64 -96 -8 -112" fill="none" {...ink(12, C.ink)} />
        <path d="M -24 4 C -70 -20 -64 -96 -8 -112" fill="none" stroke="#F6D9D2" strokeWidth={9} strokeLinecap="round" />
        <path d="M 24 4 C 70 -20 64 -96 8 -112" fill="none" {...ink(12, C.ink)} />
        <path d="M 24 4 C 70 -20 64 -96 8 -112" fill="none" stroke="#F6D9D2" strokeWidth={9} strokeLinecap="round" />
      </g>
      {/* neck + head */}
      <rect x={-6} y={-322} width={12} height={22} fill="#F1CDBE" {...ink(1.6)} />
      <g transform="translate(0 -344)">
        <ellipse rx={27} ry={30} fill="url(#g-skin)" {...ink(2.2)} />
        <g opacity={facing} transform={`translate(${s * 9} 0)`}>
          <path d="M -12 -2 Q -8 2 -4 -2 M 4 -2 Q 8 2 12 -2" {...hair(1.8, C.ink)} />
          <ellipse cx={-14} cy={8} rx={6} ry={4} fill="url(#g-cheek)" />
          <ellipse cx={14} cy={8} rx={6} ry={4} fill="url(#g-cheek)" />
          <path d="M -4 14 Q 0 17 4 14" {...hair(1.6, C.burgundyDeep)} />
        </g>
        {/* hair: cap + bun that circles the head as she turns */}
        <path d={`M -28 0 C -30 -34 30 -34 28 0 C 22 -14 ${-s * 12} -20 -28 0 Z`} fill={hairColor} {...ink(2)} />
        <path d={`M -28 0 C -30 -34 30 -34 28 0`} fill="none" {...ink(2)} />
        <g opacity={1 - facing}>
          <ellipse rx={27} ry={30} fill={hairColor} {...ink(2.2)} />
        </g>
        <circle cx={-s * 18} cy={-28} r={13} fill={hairColor} {...ink(2)} />
        <path d="M -16 -26 Q 0 -40 16 -26" fill="none" {...ink(4, C.goldLight)} />
        <circle cx={0} cy={-34} r={4} fill="#FFF6DA" />
      </g>
    </g>
  );
};

/** Candy-cane lamp post with a glowing lantern. Origin = base. */
export const CandyLamp: React.FC<{h: number; f: number; flip?: boolean}> = ({h, f, flip}) => (
  <g transform={flip ? 'scale(-1 1)' : undefined}>
    <rect x={-10} y={-h} width={20} height={h} fill={C.white} {...ink(2)} />
    <path d={range(Math.round(h / 34)).map((k) => `M -10 ${-k * 34} L 10 ${-k * 34 - 20}`).join(' ')} {...ink(7, C.burgundyLight)} />
    <path d={`M 0 ${-h} C 0 ${-h - 70} 90 ${-h - 70} 90 ${-h - 10}`} fill="none" {...ink(16, C.ink)} />
    <path d={`M 0 ${-h} C 0 ${-h - 70} 90 ${-h - 70} 90 ${-h - 10}`} fill="none" stroke={C.white} strokeWidth={12} strokeLinecap="round" />
    <path d={`M 0 ${-h} C 0 ${-h - 70} 90 ${-h - 70} 90 ${-h - 10}`} fill="none" stroke={C.burgundyLight} strokeWidth={12} strokeDasharray="10 14" />
    <g transform={`translate(90 ${-h + 14}) rotate(${Math.sin(f / 25) * 4} 0 -24)`}>
      <circle cy={20} r={60} fill="url(#g-warm)" opacity={0.8 + Math.sin(f / 7) * 0.15} />
      <path d="M -18 -10 L 18 -10 L 22 40 L -22 40 Z" fill="#FFEBB5" {...ink(2)} />
      <path d="M -24 -10 L 24 -10 L 0 -30 Z M -24 40 L 24 40 L 18 50 L -18 50 Z" fill="url(#g-gold)" {...ink(1.8)} />
    </g>
  </g>
);
