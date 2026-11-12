import { useCallback, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ReviewCamera } from "./camera/ReviewCamera";
import { FOV, overview, zoneView, type CameraView } from "./camera/views";
import { lighting } from "./design";
import { Overlay } from "./ui/Overlay";
import type { ZoneId } from "./world/layout";
import { World } from "./world/World";

export default function App() {
  const [active, setActive] = useState<ZoneId | "overview">("overview");
  const [view, setView] = useState<CameraView>(() => overview(window.innerWidth / window.innerHeight));
  const [showLabels, setShowLabels] = useState(true);
  const [showScale, setShowScale] = useState(false);

  const select = useCallback((id: ZoneId | "overview") => {
    setActive(id);
    // a fresh object every time, so re-selecting the same zone re-centres the camera
    setView(id === "overview" ? overview(window.innerWidth / window.innerHeight) : { ...zoneView(id) });
  }, []);

  const camera = useMemo(() => ({ fov: FOV, near: 1, far: 4000, position: [0, 80, 160] as [number, number, number] }), []);

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
          if (import.meta.env.DEV) Object.assign(window, { __skyVillage: { gl: state.gl, scene: state.scene, camera: state.camera, get controls() { return state.get().controls; } } });
        }}
      >
        <ReviewCamera view={view} />
        <World showLabels={showLabels} showScale={showScale} />
      </Canvas>
      <Overlay
        active={active}
        onSelect={select}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((v) => !v)}
        showScale={showScale}
        onToggleScale={() => setShowScale((v) => !v)}
      />
    </>
  );
}
