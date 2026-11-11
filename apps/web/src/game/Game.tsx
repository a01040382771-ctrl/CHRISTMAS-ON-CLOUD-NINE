import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useUi } from "../state/store";
import { QUALITY } from "../state/quality";
import { World } from "./World";
import { LocalPlayer } from "./avatar/LocalPlayer";
import { RemotePlayers } from "./avatar/RemotePlayers";
import { Snow } from "./world/Snow";
import { input, installCameraControls, installKeyboard } from "./controls/input";
import { localPlayer, snowTarget } from "./state";
import { treeFade } from "./controls/cameraRig";
import { projectTags } from "./nametags";
import { net } from "../net/client";
import { useUi as useUiStore } from "../state/store";

/** Slow cinematic orbit behind the entry screen. */
function OrbitCamera() {
  const camera = useThree((s) => s.camera);
  // ?orbit=<radians> picks the starting angle (handy for screenshots)
  const start = useRef(Number(new URLSearchParams(location.search).get("orbit") ?? 0.6)).current;
  const camH = useRef(Number(new URLSearchParams(location.search).get("oh") ?? 15)).current;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.045 + start;
    camera.position.set(8 + Math.sin(t) * 46, camH + Math.sin(t * 0.7) * 2.5, Math.cos(t) * 46);
    camera.lookAt(6, 4.5, 0);
    snowTarget.current.set(camera.position.x, 0, camera.position.z);
  });
  return null;
}

/** Positions the DOM nickname labels after the camera has moved this frame. */
function TagProjector() {
  useFrame(({ camera, size }) => projectTags(camera, size.width, size.height));
  return null;
}

/** Dev/test probe: exposes read-only runtime facts on window.__sky (used by the browser tests). */
function DebugProbe() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__sky = {
      player: localPlayer,
      input,
      scene,
      treeFade,
      teleport: (x: number, z: number) => net.room?.send("debug_teleport", { x, z }),
      remotes: () => [...net.remotes.values()].map((r) => ({ id: r.info.id, name: r.info.name, last: r.buf[r.buf.length - 1] })),
      selfId: () => net.selfId,
      roomId: () => useUiStore.getState().roomId,
      conn: () => useUiStore.getState().conn,
      info: () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures }),
      dropSocket: () => (net.room as unknown as { connection: { transport: { ws: WebSocket } } }).connection.transport.ws.close(4001),
    };
  }, [gl, scene]);
  return null;
}

export function Game() {
  const phase = useUi((s) => s.phase);
  const quality = useUi((s) => s.quality);
  const q = QUALITY[quality];
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => installKeyboard(), []);
  useEffect(() => (wrapRef.current ? installCameraControls(wrapRef.current) : undefined), []);

  return (
    <div ref={wrapRef} className="game-canvas" style={{ touchAction: "none" }}>
      <Canvas
        key={q.antialias ? "aa" : "noaa"}
        shadows={q.shadows}
        dpr={q.dpr}
        gl={{ antialias: q.antialias, powerPreference: "high-performance" }}
        camera={{ fov: 52, near: 0.1, far: 700, position: [0, 12, 40] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Suspense fallback={null}>
          <World />
          {phase === "playing" ? (
            <>
              <LocalPlayer />
              <RemotePlayers />
            </>
          ) : (
            <OrbitCamera />
          )}
          <Snow count={q.snowParticles} target={snowTarget} />
          <TagProjector />
          <DebugProbe />
        </Suspense>
      </Canvas>
    </div>
  );
}
