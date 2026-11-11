/** Tunables shared by client and server. */
export const MAX_PLAYERS_PER_ROOM = 16;
export const ROOM_NAME = "party";

/** Avatar metrics — the whole village is proportioned around these. */
export const AVATAR_RADIUS = 0.4;
export const AVATAR_HEIGHT = 1.6;
export const WALK_SPEED = 4.6; // world units / second
/** Extra distance kept from cliffs so avatars never visually hang over the edge. */
export const EDGE_MARGIN = 0.35;

export const SERVER_TICK_HZ = 20;
export const SNAPSHOT_HZ = 15;
/** Client sends its movement intent at most this often (plus on change). */
export const INPUT_SEND_HZ = 15;
/** Server zeroes input if nothing arrived for this long (packet loss / tab hidden). */
export const INPUT_TIMEOUT_MS = 400;
export const MAX_INPUT_MSGS_PER_SEC = 40;

export const NAME_MAX_LEN = 12;
export const RECONNECT_WINDOW_SEC = 20;

/** Client snaps to the server position when it drifts further than this. */
/** Between this and SNAP_DISTANCE the client eases toward the server position. ~1 m covers normal latency while walking. */
export const SOFT_CORRECT_DISTANCE = 1.2;
export const SNAP_DISTANCE = 3;

export const AVATAR_COLORS = [
  "#c8323c", // holly red
  "#2f7d4f", // pine green
  "#e58aa5", // pastel pink
  "#5b8fc9", // winter blue
  "#8c2f4b", // burgundy
  "#d9a441", // champagne gold
] as const;
