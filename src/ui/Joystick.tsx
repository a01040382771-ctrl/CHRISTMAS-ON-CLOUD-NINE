import { useRef, useState } from "react";
import { input } from "../player/input";

const RADIUS = 52;

/** On-screen joystick (bottom-left). Push to walk; push to the rim to run. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, on: false });

  const update = (clientX: number, clientY: number) => {
    const r = base.current!.getBoundingClientRect();
    let x = clientX - (r.left + r.width / 2), y = clientY - (r.top + r.height / 2);
    const len = Math.hypot(x, y);
    if (len > RADIUS) { x = (x / len) * RADIUS; y = (y / len) * RADIUS; }
    input.joyX = x / RADIUS;
    input.joyY = -y / RADIUS;
    input.joyRun = len >= RADIUS * 0.95;
    setKnob({ x, y, on: true });
  };
  const release = () => {
    active.current = null;
    input.joyX = input.joyY = 0;
    input.joyRun = false;
    setKnob({ x: 0, y: 0, on: false });
  };

  return (
    <div
      ref={base}
      className={`joystick${knob.on ? " on" : ""}`}
      onPointerDown={(e) => {
        if (active.current !== null) return;
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => { if (e.pointerId === active.current) update(e.clientX, e.clientY); }}
      onPointerUp={(e) => { if (e.pointerId === active.current) release(); }}
      onPointerCancel={(e) => { if (e.pointerId === active.current) release(); }}
      role="presentation"
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
