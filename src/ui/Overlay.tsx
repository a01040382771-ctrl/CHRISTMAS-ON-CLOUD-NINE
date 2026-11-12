import { zones, type ZoneId } from "../world/layout";
import { zoneLabelId } from "../world/props/ZoneLabels";

export type Mode = "view" | "explore";

interface Props {
  mode: Mode;
  touch: boolean;
  active: ZoneId | "overview";
  onSelect: (id: ZoneId | "overview") => void;
  onExplore: () => void;
  onExitExplore: () => void;
  onRespawn: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showScale: boolean;
  onToggleScale: () => void;
}

/** Overlay: title, zone shortcuts, view toggles, and the explore-mode controls. */
export function Overlay(p: Props) {
  const exploring = p.mode === "explore";
  // keep keyboard focus off buttons so Space / arrow keys never "click" them while walking
  const tap = (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => { fn(); e.currentTarget.blur(); };
  return (
    <div className={`overlay ${exploring ? "exploring" : "viewing"}`}>
      {p.showLabels && (
        <div className="labels" aria-hidden>
          {zones.map((z) => (
            <div key={z.id} id={zoneLabelId(z.id)} className="zone-label"><b>{String(z.index).padStart(2, "0")}</b>{z.name}</div>
          ))}
        </div>
      )}

      <header className="title">
        <span className="eyebrow">The Christmas Afterparty</span>
        <h1>Sky Village</h1>
        <span className="phase">{exploring ? "탐험 모드 · Explore" : "월드 감상 모드 · World view"}</span>
      </header>

      <nav className="zones" aria-label="구역 바로가기">
        <button className={!exploring && p.active === "overview" ? "on" : ""} onClick={tap(() => p.onSelect("overview"))}>
          <b>✦</b><span>전체 보기<small>Village overview</small></span>
        </button>
        {zones.map((z) => (
          <button key={z.id} title={`${z.name} · ${z.nameKo}`} className={!exploring && p.active === z.id ? "on" : ""} onClick={tap(() => p.onSelect(z.id))}>
            <b>{String(z.index).padStart(2, "0")}</b><span>{z.name}<small>{z.nameKo}</small></span>
          </button>
        ))}
      </nav>

      <footer className="bar">
        <div className="toggles">
          {exploring ? (
            <>
              <button className="primary" onClick={tap(p.onExitExplore)}>월드 감상으로</button>
              <button onClick={tap(p.onRespawn)}>시작 위치로</button>
            </>
          ) : (
            <button className="primary explore" onClick={tap(p.onExplore)}>탐험 시작</button>
          )}
          <button className={p.showLabels ? "on" : ""} aria-pressed={p.showLabels} onClick={tap(p.onToggleLabels)}>구역 라벨</button>
          {!exploring && <button className={p.showScale ? "on" : ""} aria-pressed={p.showScale} onClick={tap(p.onToggleScale)}>아바타 스케일</button>}
        </div>
        <p className="hint">
          {exploring
            ? p.touch
              ? <span>왼쪽 조이스틱 이동 · 끝까지 밀면 달리기 · 화면 드래그 시점 · 두 손가락 거리</span>
              : <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동 · <kbd>Shift</kbd> 달리기 · 드래그 시점 · 휠 거리 · <kbd>R</kbd> 시작 위치</span>
            : p.touch
              ? <span>한 손가락 회전 · 두 손가락 확대/이동</span>
              : <span>드래그 회전 · 휠 확대/축소 · 우클릭 드래그 이동</span>}
        </p>
      </footer>
    </div>
  );
}
