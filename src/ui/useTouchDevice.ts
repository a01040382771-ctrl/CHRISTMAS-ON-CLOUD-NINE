import { useEffect, useState } from "react";

const query = "(hover: none) and (pointer: coarse)";
const forced = new URLSearchParams(window.location.search).has("touch");

/** True on phones and tablets (or with ?touch in the URL): shows the joystick and touch hints. */
export function useTouchDevice() {
  const [touch, setTouch] = useState(() => forced || window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setTouch(forced || mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return touch;
}
