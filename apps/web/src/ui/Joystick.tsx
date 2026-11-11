import { useEffect, useRef } from "react";
import { input } from "../game/controls/input";

/** Virtual joystick for touch devices. Sets input.joyX/joyY (-1..1). Excluded from camera dragging via data-no-orbit. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const R = 52;

  useEffect(() => {
    const el = base.current!;
    const set = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > R) {
        dx = (dx / len) * R;
        dy = (dy / len) * R;
      }
      knob.current!.style.transform = `translate(${dx}px, ${dy}px)`;
      // dead zone, then 0..1 magnitude along the stick direction
      const k = Math.min(1, len / R);
      const mag = k < 0.12 ? 0 : (k - 0.12) / 0.88;
      input.joyX = len > 0 ? (dx / len) * mag : 0;
      input.joyY = len > 0 ? (-dy / len) * mag : 0;
    };
    const down = (e: PointerEvent) => {
      if (active.current !== null) return;
      active.current = e.pointerId;
      el.setPointerCapture(e.pointerId);
      set(e);
      e.stopPropagation();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId === active.current) set(e);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== active.current) return;
      active.current = null;
      input.joyX = input.joyY = 0;
      knob.current!.style.transform = "translate(0,0)";
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      input.joyX = input.joyY = 0;
    };
  }, []);

  return (
    <div ref={base} className="joystick" data-no-orbit aria-label="이동 조이스틱" role="slider">
      <div ref={knob} className="joystick-knob" />
    </div>
  );
}
