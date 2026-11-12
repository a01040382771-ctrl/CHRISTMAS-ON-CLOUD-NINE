import { zones, type ZoneId } from "../world/layout";
import { zoneLabelId } from "../world/props/ZoneLabels";

interface Props {
  active: ZoneId | "overview";
  onSelect: (id: ZoneId | "overview") => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showScale: boolean;
  onToggleScale: () => void;
}

/** Design-review overlay: title, zone shortcuts and view toggles. */
export function Overlay({ active, onSelect, showLabels, onToggleLabels, showScale, onToggleScale }: Props) {
  return (
    <div className="overlay">
      {showLabels && (
        <div className="labels" aria-hidden>
          {zones.map((z) => (
            <div key={z.id} id={zoneLabelId(z.id)} className="zone-label"><b>{String(z.index).padStart(2, "0")}</b>{z.name}</div>
          ))}
        </div>
      )}
      <header className="title">
        <span className="eyebrow">The Christmas Afterparty</span>
        <h1>Sky Village</h1>
        <span className="phase">Phase 1 · World Layout &amp; Design System</span>
      </header>

      <nav className="zones" aria-label="구역 바로가기">
        <button className={active === "overview" ? "on" : ""} onClick={() => onSelect("overview")}>
          <b>✦</b><span>전체 보기<small>Village overview</small></span>
        </button>
        {zones.map((z) => (
          <button key={z.id} className={active === z.id ? "on" : ""} onClick={() => onSelect(z.id)}>
            <b>{String(z.index).padStart(2, "0")}</b><span>{z.name}<small>{z.nameKo}</small></span>
          </button>
        ))}
      </nav>

      <footer className="bar">
        <div className="toggles">
          <button className={showLabels ? "on" : ""} aria-pressed={showLabels} onClick={onToggleLabels}>구역 라벨</button>
          <button className={showScale ? "on" : ""} aria-pressed={showScale} onClick={onToggleScale}>아바타 스케일</button>
        </div>
        <p className="hint">
          <span className="desktop">드래그 회전 · 휠 확대/축소 · 우클릭 드래그 이동</span>
          <span className="touch">한 손가락 회전 · 두 손가락 확대/이동</span>
        </p>
      </footer>
    </div>
  );
}
