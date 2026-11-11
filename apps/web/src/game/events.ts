/**
 * Tiny typed event bus + interactable registry.
 *
 * This is the extension seam for Phase 5 (party hall, wish forest, market,
 * mini-games, photo booth): world objects register an `Interactable`; the local
 * player's proximity check surfaces a prompt; pressing E emits "interact".
 * Features subscribe to events instead of being wired into the player code.
 */
export interface Interactable {
  id: string;
  x: number;
  z: number;
  radius: number;
  title: string;
  /** shown under the title, e.g. "E — 입장" or "준비 중" */
  hint: string;
}

export interface GameEvents {
  interact: { id: string };
  zoneEnter: { id: string };
  zoneLeave: { id: string };
}

type Handler<K extends keyof GameEvents> = (payload: GameEvents[K]) => void;

const handlers = new Map<keyof GameEvents, Set<(payload: never) => void>>();

export function on<K extends keyof GameEvents>(type: K, fn: Handler<K>): () => void {
  let set = handlers.get(type);
  if (!set) handlers.set(type, (set = new Set()));
  set.add(fn as (payload: never) => void);
  return () => set!.delete(fn as (payload: never) => void);
}

export function emit<K extends keyof GameEvents>(type: K, payload: GameEvents[K]) {
  handlers.get(type)?.forEach((fn) => (fn as Handler<K>)(payload));
}

const registry = new Map<string, Interactable>();
export function registerInteractable(i: Interactable): () => void {
  registry.set(i.id, i);
  return () => registry.delete(i.id);
}
export function allInteractables(): IterableIterator<Interactable> {
  return registry.values();
}
