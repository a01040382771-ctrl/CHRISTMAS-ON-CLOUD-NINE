import React from 'react';
import {C} from '../styles/palette';
import {hair, ink} from './Defs';
import {range} from '../animations/particles';
import {TITLE_FONT} from '../styles/fonts';

/**
 * Toy soldier (cousin of the Nutcracker: same wood-peg construction, green
 * coat, burgundy shako). Origin = between the boots. ~260 tall.
 * `step` is the march phase in beats (one beat = one footstep).
 */
export const ToySoldier: React.FC<{step: number; drum?: boolean; marching?: boolean}> = ({step, drum = false, marching = true}) => {
  const ph = step * Math.PI; // left/right foot alternates each beat
  const swing = marching ? Math.sin(ph) * 22 : 0;
  const bob = marching ? -Math.abs(Math.cos(ph)) * 6 : 0;
  const leg = (s: -1 | 1) => (
    <g transform={`translate(${s * 13} -96) rotate(${s * swing})`}>
      <path d="M -11 0 L -11 40 L 11 40 L 11 0 Z" fill={C.white} {...ink(2)} />
      <path d="M -11 40 L -11 80 C -11 88 -4 90 4 90 L 18 90 C 24 90 24 82 16 80 L 11 80 L 11 40 Z" fill="url(#g-boot)" {...ink(2)} />
      <rect x={-12} y={36} width={24} height={7} fill="url(#g-gold)" {...ink(1.2)} />
    </g>
  );
  return (
    <g transform={`translate(0 ${bob - 6})`} filter="url(#gouache)">
      {leg(-1)}
      {leg(1)}
      {/* back arm */}
      <g transform={`translate(-30 -180) rotate(${drum ? 30 : swing})`}>
        <path d="M -8 0 L -8 58 L 8 58 L 8 0 Z" fill="url(#g-green)" {...ink(2)} />
        <circle cy={64} r={8} fill={C.white} {...ink(1.6)} />
      </g>
      {/* body */}
      <path d="M -30 -186 C -34 -150 -34 -118 -30 -96 L 30 -96 C 34 -118 34 -150 30 -186 Q 0 -194 -30 -186 Z" fill="url(#g-green)" {...ink(2.2)} />
      <path d="M -26 -112 L 26 -112" {...ink(9, C.white)} />
      <path d="M -26 -112 L 26 -112" {...hair(1, C.inkSoft)} />
      <path d="M -24 -186 L 22 -112 M 24 -186 L -22 -112" {...ink(5, C.white)} />
      {[-170, -152, -134].map((y) => (
        <circle key={y} cx={0} cy={y} r={3.4} fill="url(#g-ball-gold)" {...ink(1)} />
      ))}
      {[-1, 1].map((s) => (
        <path key={s} d={`M ${s * 18} -190 Q ${s * 34} -198 ${s * 40} -184 L ${s * 26} -180 Z`} fill="url(#g-gold)" {...ink(1.4)} />
      ))}
      {drum && (
        <g transform="translate(0 -104)">
          <path d="M -34 -10 L -34 26 Q 0 38 34 26 L 34 -10 Z" fill={C.burgundy} {...ink(2)} />
          <path d="M -34 -6 L -14 24 L 6 -6 L 26 24" fill="none" {...ink(2, C.gold)} />
          <ellipse cy={-10} rx={34} ry={9} fill={C.ivory} {...ink(2)} />
        </g>
      )}
      {/* head */}
      <rect x={-26} y={-238} width={52} height={50} rx={10} fill="url(#g-woodface)" {...ink(2.2)} />
      <circle cx={-10} cy={-216} r={3.4} fill={C.ink} />
      <circle cx={10} cy={-216} r={3.4} fill={C.ink} />
      <circle cx={-16} cy={-204} r={5.5} fill="url(#g-cheek)" />
      <circle cx={16} cy={-204} r={5.5} fill="url(#g-cheek)" />
      <path d="M -12 -201 Q -6 -206 0 -201 Q 6 -206 12 -201 Q 6 -196 0 -199 Q -6 -196 -12 -201 Z" fill={C.hairDeep} />
      {/* shako */}
      <path d="M -24 -236 L -26 -294 Q 0 -300 26 -294 L 24 -236 Z" fill={C.burgundy} {...ink(2.2)} />
      <ellipse cx={0} cy={-294} rx={26} ry={6} fill={C.burgundyDeep} {...ink(1.6)} />
      <path d="M -25 -246 L 25 -246" {...ink(6, C.gold)} />
      <path d="M -26 -238 Q 0 -230 26 -238" {...ink(5, '#1C1A20')} />
      <circle cx={0} cy={-270} r={7} fill="url(#g-ball-gold)" {...ink(1.2)} />
      <path d="M 0 -300 C -8 -312 -4 -326 4 -332 C 2 -320 8 -314 6 -302 Z" fill={C.white} {...ink(1.4)} />
      {/* front arm with rifle or drumstick */}
      <g transform={`translate(30 -180) rotate(${drum ? -40 - Math.max(0, Math.sin(ph * 2)) * 30 : -swing * 0.6})`}>
        <path d="M -8 0 L -8 58 L 8 58 L 8 0 Z" fill="url(#g-green)" {...ink(2)} />
        {drum ? (
          <path d="M 0 62 L 0 110" {...ink(4, C.woodDeep)} />
        ) : (
          <g transform="translate(0 64) rotate(-150)">
            <path d="M -4 -10 L -4 110 L 4 110 L 4 -10 Z" fill={C.woodDeep} {...ink(1.6)} />
            <path d="M 0 110 L 0 140" {...ink(2.6, C.goldLight)} />
          </g>
        )}
        <circle cy={64} r={8} fill={C.white} {...ink(1.6)} />
      </g>
    </g>
  );
};

/** Pop-up toy castle. Origin = base centre. ~520 tall. */
export const ToyCastle: React.FC<{f: number}> = ({f}) => {
  const tower = (x: number, w: number, h: number, roof: string) => (
    <g transform={`translate(${x} 0)`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={C.powderLight} {...ink(2.4)} />
      <path d={`M ${-w / 2} ${-h * 0.6} L ${w / 2} ${-h * 0.6} M ${-w / 2} ${-h * 0.3} L ${w / 2} ${-h * 0.3}`} {...hair(1.2)} />
      <path d={`M ${-w / 2 - 10} ${-h} L 0 ${-h - w * 1.2} L ${w / 2 + 10} ${-h} Z`} fill={roof} {...ink(2.4)} />
      <path d={`M ${-w / 4} ${-h - 10} L 0 ${-h - w * 1.1}`} {...hair(1.4, 'rgba(255,255,255,0.3)')} />
      <path d={`M 0 ${-h - w * 1.2} L 0 ${-h - w * 1.2 - 40}`} {...ink(2.2)} />
      <path
        d={`M 0 ${-h - w * 1.2 - 40} Q ${16} ${-h - w * 1.2 - 46 + Math.sin(f / 6 + x) * 4} 34 ${-h - w * 1.2 - 38 + Math.sin(f / 6 + x + 1) * 5} L 0 ${-h - w * 1.2 - 24} Z`}
        fill={C.gold}
        {...ink(1.6)}
      />
      <path d={`M -9 ${-h * 0.72} L -9 ${-h * 0.82} A 9 9 0 0 1 9 ${-h * 0.82} L 9 ${-h * 0.72} Z`} fill="#F4CC7A" {...ink(1.8)} />
    </g>
  );
  return (
    <g>
      <rect x={-150} y={-260} width={300} height={260} fill={C.ivory} {...ink(2.6)} />
      <path d={range(8).map((i) => `M ${-150 + i * 40} -260 l 0 -24 l 22 0 l 0 24`).join(' ')} fill={C.ivory} {...ink(2.2)} />
      <path d="M -150 -180 L 150 -180 M -150 -100 L 150 -100 M -100 -260 L -100 -180 M 60 -180 L 60 -100 M -40 -100 L -40 0" {...hair(1.2)} />
      <path d="M -50 0 L -50 -90 A 50 50 0 0 1 50 -90 L 50 0 Z" fill={C.woodDeep} {...ink(2.4)} />
      <path d="M -50 -90 A 50 50 0 0 1 50 -90" fill="none" {...ink(6, C.gold)} />
      <path d="M -30 0 L -30 -96 M -10 0 L -10 -116 M 10 0 L 10 -116 M 30 0 L 30 -96" {...hair(1.4, C.ink)} />
      {tower(-150, 90, 360, C.burgundy)}
      {tower(150, 90, 330, C.burgundy)}
      {tower(0, 110, 420, C.forest)}
      <path d="M -100 -230 L -60 -230 M 60 -230 L 100 -230" {...ink(12, C.burgundy)} />
    </g>
  );
};

/** Little paper toy theatre with closed velvet curtains. Origin = base centre. */
export const ToyTheater: React.FC<{f: number; open?: number}> = ({f, open = 0}) => {
  const stageW = 250;
  const stageH = 260;
  return (
    <g>
      {/* base */}
      <path d="M -200 0 L 200 0 L 190 -90 L -190 -90 Z" fill={C.woodDeep} {...ink(2.6)} />
      <path d="M -170 -60 L 170 -60" {...ink(3, C.gold)} strokeDasharray="20 10" />
      {/* footlights */}
      {range(7).map((i) => (
        <g key={i} transform={`translate(${-120 + i * 40} -96)`}>
          <circle cy={-6} r={14} fill="url(#g-warm)" opacity={0.8 + Math.sin(f / 4 + i) * 0.2} />
          <path d="M 0 -12 C 4 -6 4 -2 0 0 C -4 -2 -4 -6 0 -12 Z" fill="url(#g-flame)" />
        </g>
      ))}
      {/* proscenium */}
      <path
        d={`M -200 -90 L -200 -470 Q 0 -560 200 -470 L 200 -90 L ${stageW / 2} -90 L ${stageW / 2} ${-90 - stageH} Q 0 ${-90 - stageH - 50} ${-stageW / 2} ${-90 - stageH} L ${-stageW / 2} -90 Z`}
        fill="url(#g-gold)"
        fillRule="evenodd"
        {...ink(2.6)}
      />
      {/* stage interior */}
      <path d={`M ${stageW / 2} -90 L ${stageW / 2} ${-90 - stageH} Q 0 ${-90 - stageH - 50} ${-stageW / 2} ${-90 - stageH} L ${-stageW / 2} -90 Z`} fill="#3A1E26" {...ink(2.2)} />
      <ellipse cx={0} cy={-150} rx={110} ry={80} fill="url(#g-warm)" opacity={0.6} />
      {/* curtains */}
      {[-1, 1].map((s) => (
        <path
          key={s}
          d={`M ${s * (stageW / 2)} ${-90 - stageH - 10} L ${s * (stageW / 2 - open * 100) - s * (stageW / 2) * (1 - open) * 0} ${-90 - stageH - 10} L ${s * (2 + open * 90)} ${-90 - stageH + 20} Q ${s * (4 + open * 70)} -200 ${s * (2 + open * 96)} -92 L ${s * (stageW / 2)} -92 Z`}
          fill={C.burgundy}
          {...ink(2.2)}
        />
      ))}
      <path d={`M -100 -330 Q -110 -200 -100 -96 M -60 -340 Q -66 -220 -60 -96 M -24 -330 Q -28 -220 -24 -96 M 24 -330 Q 28 -220 24 -96 M 60 -340 Q 66 -220 60 -96 M 100 -330 Q 110 -200 100 -96`} {...hair(1.6, C.burgundyDeep)} />
      <path d={`M ${-stageW / 2} -352 Q 0 -300 ${stageW / 2} -352`} fill="none" {...ink(16, C.burgundyLight)} />
      <path d={`M ${-stageW / 2} -346 Q 0 -294 ${stageW / 2} -346`} fill="none" {...ink(6, C.gold)} strokeDasharray="2 6" />
      {/* ornaments */}
      <path d="M -180 -460 Q 0 -540 180 -460" {...hair(1.6, C.goldDeep)} />
      <rect x={-90} y={-505} width={180} height={40} rx={8} fill={C.burgundy} {...ink(2)} />
      <text x={0} y={-476} textAnchor="middle" fontFamily={TITLE_FONT} fontSize={26} fill={C.goldLight} letterSpacing={3}>
        THEATRE
      </text>
      <circle cx={0} cy={-540} r={16} fill="url(#g-ball-gold)" {...ink(1.6)} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * 175 - 12} y={-440} width={24} height={340} fill={C.goldLight} {...ink(1.8)} />
          <path d={`M ${s * 175} -430 L ${s * 175} -110`} {...hair(1.4, C.goldDeep)} />
        </g>
      ))}
    </g>
  );
};

/** Green velvet wing chair (before it turns into a castle). Origin = floor centre. */
export const Armchair: React.FC = () => (
  <g>
    <path d="M -130 -20 L -120 0 M 130 -20 L 120 0 M -80 -20 L -86 4 M 80 -20 L 86 4" {...ink(8, C.woodDeep)} />
    <path d="M -110 -380 C -120 -440 120 -440 110 -380 L 116 -150 L -116 -150 Z" fill="url(#g-green)" {...ink(2.6)} />
    <path d="M -60 -380 L -60 -170 M 0 -400 L 0 -170 M 60 -380 L 60 -170" {...hair(1.4, C.forestDeep)} />
    {range(3).map((i) => (
      <circle key={i} cx={-60 + i * 60} cy={-300} r={4} fill={C.gold} />
    ))}
    <path d="M -150 -260 C -170 -260 -170 -200 -150 -190 L -146 -30 L -110 -30 L -110 -200 Z" fill={C.forest} {...ink(2.4)} />
    <path d="M 150 -260 C 170 -260 170 -200 150 -190 L 146 -30 L 110 -30 L 110 -200 Z" fill={C.forest} {...ink(2.4)} />
    <path d="M -130 -160 Q 0 -190 130 -160 L 136 -30 L -136 -30 Z" fill={C.forestLight} {...ink(2.4)} />
    <path d="M -136 -30 L 136 -30" {...ink(5, C.gold)} strokeDasharray="2 8" />
  </g>
);

/** Small bookcase (before it becomes the theatre). Origin = floor centre. */
export const Bookcase: React.FC = () => {
  const cols = [C.burgundy, C.forest, C.gold, C.powderDeep, C.burgundyLight, C.navy, C.forestLight];
  return (
    <g>
      <rect x={-170} y={-520} width={340} height={520} fill="url(#g-wood)" {...ink(2.6)} />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x={-150} y={-500 + r * 165} width={300} height={140} fill="#5A3A26" {...ink(2)} />
          {range(9).map((i) => {
            const h = 90 + ((i * 37 + r * 11) % 40);
            return <rect key={i} x={-146 + i * 32} y={-500 + r * 165 + 140 - h} width={26} height={h} fill={cols[(i + r * 2) % cols.length]} {...ink(1.6)} />;
          })}
        </g>
      ))}
      <rect x={-184} y={-540} width={368} height={26} fill="url(#g-wood)" {...ink(2.4)} />
    </g>
  );
};
