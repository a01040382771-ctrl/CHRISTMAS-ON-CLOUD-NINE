import { AVATAR_COLORS, NAME_MAX_LEN } from "./constants";

/** Server-side validation of user-supplied join options. */
export function sanitizeName(raw: unknown): string {
  const s = typeof raw === "string" ? raw : "";
  // strip control chars and markup characters (names are rendered in the DOM)
  const cleaned = s.replace(/[\u0000-\u001f\u007f<>&"']/g, "").replace(/\s+/g, " ").trim();
  const clipped = Array.from(cleaned).slice(0, NAME_MAX_LEN).join("");
  return clipped || "Guest";
}

export function sanitizeColor(raw: unknown): number {
  const n = typeof raw === "number" && Number.isInteger(raw) ? raw : 0;
  return n >= 0 && n < AVATAR_COLORS.length ? n : 0;
}
