import { useState } from "react";
import { AVATAR_COLORS, NAME_MAX_LEN } from "@sky/shared";
import { useUi } from "../state/store";
import { errMsg, net } from "../net/client";

function inviteRoom(): string | null {
  try {
    return new URLSearchParams(location.search).get("room");
  } catch {
    return null;
  }
}

export function EntryScreen() {
  const { name, color, set, phase, error } = useUi();
  const [busy, setBusy] = useState(false);
  const invite = inviteRoom();

  const enter = async () => {
    const clean = name.trim() || "Guest";
    setBusy(true);
    set({ phase: "connecting", name: clean });
    try {
      await net.join({ name: clean, color }, invite);
    } catch (e) {
      set({ phase: "entry", conn: "offline", error: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  if (phase === "playing") return null;

  return (
    <div className="entry">
      <form
        className="entry-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void enter();
        }}
      >
        <div className="entry-kicker">THE CHRISTMAS AFTERPARTY</div>
        <h1>Sky Village</h1>
        <p className="entry-sub">구름 위 크리스마스 마을에서 친구들과 함께 산책해요 ✨</p>

        {invite && <div className="entry-invite">💌 친구의 파티룸에 초대받았어요</div>}

        <label className="field">
          <span>닉네임</span>
          <input
            value={name}
            maxLength={NAME_MAX_LEN}
            placeholder="예: 눈송이"
            autoFocus
            autoComplete="off"
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>

        <div className="field">
          <span>아바타 코트 색</span>
          <div className="swatches" role="radiogroup" aria-label="아바타 색상">
            {AVATAR_COLORS.map((c, i) => (
              <button
                type="button"
                key={c}
                role="radio"
                aria-checked={color === i}
                className={`swatch${color === i ? " on" : ""}`}
                style={{ background: c }}
                onClick={() => set({ color: i })}
                aria-label={`색상 ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {error && <div className="entry-error" role="alert">{error}</div>}

        <button className="cta" type="submit" disabled={busy}>
          {busy ? "마을로 가는 중…" : invite ? "초대받은 방으로 입장" : "마을에 입장하기"}
        </button>
        <p className="entry-hint">PC: WASD 이동 · 드래그로 시점 회전 · 휠 줌 &nbsp;|&nbsp; 모바일: 왼쪽 조이스틱 · 화면 드래그로 시점</p>
      </form>
    </div>
  );
}
