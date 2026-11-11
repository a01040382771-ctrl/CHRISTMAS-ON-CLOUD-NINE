import { useEffect, useState } from "react";
import { useUi, type ConnStatus } from "../state/store";
import { net } from "../net/client";
import { isTouchDevice, type QualityLevel } from "../state/quality";
import { Joystick } from "./Joystick";

const CONN_LABEL: Record<ConnStatus, string> = {
  offline: "오프라인",
  connecting: "연결 중…",
  online: "온라인",
  reconnecting: "재연결 중…",
  lost: "연결 끊김",
};

export function Hud() {
  const { phase, conn, playerCount, maxPlayers, roomId, prompt, toast, quality, setQuality, showToast } = useUi();
  const [touch] = useState(() => isTouchDevice() || new URLSearchParams(location.search).has("touch"));
  const [hint, setHint] = useState(true);

  useEffect(() => {
    if (phase !== "playing") return;
    setHint(true);
    const t = setTimeout(() => setHint(false), 12000);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase !== "playing") return null;

  const copyInvite = async () => {
    if (!roomId) return;
    const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(roomId)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("초대 링크를 복사했어요! 친구에게 보내 주세요 💌");
    } catch {
      window.prompt("초대 링크를 복사해 주세요", url);
    }
  };

  return (
    <div className="hud">
      <div className="hud-top">
        <div className={`pill conn-${conn}`} role="status" aria-live="polite">
          <i className="dot" />
          {CONN_LABEL[conn]}
          <b>
            {playerCount}/{maxPlayers}
          </b>
        </div>
        <div className="hud-actions" data-no-orbit>
          <button onClick={copyInvite} title="같은 파티룸으로 친구를 초대">💌 초대 링크</button>
          <select value={quality} onChange={(e) => setQuality(e.target.value as QualityLevel)} aria-label="그래픽 품질">
            <option value="high">품질 높음</option>
            <option value="medium">품질 보통</option>
            <option value="low">품질 낮음</option>
          </select>
          <button onClick={() => net.leave()}>나가기</button>
        </div>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}

      {prompt && (
        <div className="prompt">
          <div className="prompt-title">{prompt.title}</div>
          <div className="prompt-hint">{prompt.hint}</div>
        </div>
      )}

      {hint && !touch && <div className="controls-hint">WASD / 방향키 이동 · 마우스 드래그 시점 · 휠 줌 · E 상호작용</div>}
      {touch && <Joystick />}

      {(conn === "reconnecting" || conn === "lost") && (
        <div className="overlay" data-no-orbit>
          <div className="overlay-card">
            {conn === "reconnecting" ? (
              <>
                <div className="spinner" />
                <h2>연결이 잠시 끊겼어요</h2>
                <p>같은 자리로 다시 연결하는 중이에요…</p>
              </>
            ) : (
              <>
                <h2>연결이 끊어졌어요</h2>
                <p>파티룸으로 돌아갈 수 있도록 다시 시도해 볼게요.</p>
                <button className="cta" onClick={() => void net.rejoin()}>다시 입장하기</button>
                <button className="ghost" onClick={() => net.leave()}>처음으로</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
