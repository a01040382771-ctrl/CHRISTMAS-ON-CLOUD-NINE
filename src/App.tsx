import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ReviewCamera } from "./camera/ReviewCamera";
import { FOV, overview, zoneView, type CameraView } from "./camera/views";
import { lighting } from "./design";
import { useKeyboard } from "./player/input";
import { localPlayer, requestRespawn } from "./player/localPlayer";
import { Joystick } from "./ui/Joystick";
import { Overlay, type Mode } from "./ui/Overlay";
import { useTouchDevice } from "./ui/useTouchDevice";
import type { ZoneId } from "./world/layout";
import { World } from "./world/World";
import { devHandle } from "./devHandle";

const ExploreLayer = lazy(() => import("./player/ExploreLayer"));

const params = new URLSearchParams(window.location.search);
const DEBUG_COLLIDERS = params.has("debug");

export default function App() {
  const [mode, setMode] = useState<Mode>("view");
  const [active, setActive] = useState<ZoneId | "overview">("overview");
  const [view, setView] = useState<CameraView>(() => overview(window.innerWidth / window.innerHeight));
  const [reviewStart, setReviewStart] = useState<[number, number, number] | undefined>();
  const [showLabels, setShowLabels] = useState(true);
  const [showScale, setShowScale] = useState(false);
  const touch = useTouchDevice();

  const select = useCallback((id: ZoneId | "overview") => {
    setMode((m) => {
      if (m === "explore") { const v = localPlayer.view; setReviewStart([v.x, v.y + 1.35, v.z]); }
      return "view";
    });
    setActive(id);
    // a fresh object every time, so re-selecting the same zone re-centres the camera
    setView(id === "overview" ? overview(window.innerWidth / window.innerHeight) : { ...zoneView(id) });
  }, []);

  const explore = useCallback(() => {
    setMode("explore");
    setActive("overview");
    setShowScale(false);
  }, []);
  const respawn = useCallback(() => requestRespawn(), []);
  useKeyboard(mode === "explore", respawn);

  const camera = useMemo(() => ({ fov: FOV, near: 0.3, far: 4000, position: [0, 80, 160] as [number, number, number] }), []);

  return (
    <>
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        camera={camera}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={(state) => {
          state.gl.toneMapping = THREE.NeutralToneMapping;
          state.gl.toneMappingExposure = lighting.exposure;
          // dev-only handle for automated visual / interaction checks
          if (import.meta.env.DEV) {
            // one shared object (never re-spread: that would freeze the `controls` getter)
            const dev = devHandle();
            Object.assign(dev, { gl: state.gl, scene: state.scene, camera: state.camera, THREE });
            Object.defineProperty(dev, "controls", { get: () => state.get().controls, configurable: true });
            void import("./world/layout").then((layout) => {
              dev.layout = { ...layout, islandU: (id: string, x: number, z: number) => layout.islandU(layout.island(id), x, z) };
            });
          }
        }}
      >
        {mode === "view" && <ReviewCamera view={view} startTarget={reviewStart} />}
        <World showLabels={showLabels} showScale={showScale} labelDistance={mode === "explore" ? 70 : undefined} />
        <Suspense fallback={null}>
          <ExploreLayer exploring={mode === "explore"} debug={DEBUG_COLLIDERS} />
        </Suspense>
      </Canvas>
      <Overlay
        mode={mode}
        touch={touch}
        active={active}
        onSelect={select}
        onExplore={explore}
        onExitExplore={() => select("overview")}
        onRespawn={respawn}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((v) => !v)}
        showScale={showScale}
        onToggleScale={() => setShowScale((v) => !v)}
      />
      {mode === "explore" && touch && <Joystick />}
    </>
  );
}
