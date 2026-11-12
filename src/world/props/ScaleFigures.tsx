import { materials, scale } from "../../design";
import { alongPath, bridgePoint, bridges, dockFrame, docks, island, paths, plazas, SURFACE_LIFT } from "../layout";

/** Avatar-sized stand-ins (1.7 m) for checking proportions of doors, paths and bridges. Review only. */
export function ScaleFigures() {
  const ground = (id: string) => island(id).y + SURFACE_LIFT;
  const market = alongPath(paths.find((p) => p.id === "market-street")!, 10.5).point;
  const terraceBridge = bridgePoint(bridges.find((b) => b.id === "terrace-bridge")!, 0.5);
  const dock = dockFrame(docks[0]);
  const spots: [number, number, number][] = [
    [3.5, ground("main"), 9],
    [-5, ground("main"), 7.5],
    [1.6, ground("main"), -16.5],
    [market[0], ground("main"), market[1]],
    [terraceBridge[0], terraceBridge[1], terraceBridge[2]],
    [dock.center[0], dock.y, dock.center[1] + 1],
    [plazas[1].center[0], ground("garden"), plazas[1].center[1] + 1.5],
    [plazas[2].center[0] + 3, ground("forest"), plazas[2].center[1] + 1],
    [plazas[4].center[0] - 3.5, ground("terrace"), plazas[4].center[1] + 2],
  ];
  const r = scale.avatarWidth / 2;
  return (
    <group name="scale-figures">
      {spots.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, (scale.avatarHeight - 0.5) / 2, 0]} material={materials.mannequin} castShadow>
            <capsuleGeometry args={[r, scale.avatarHeight - 0.5 - r * 2, 6, 14]} />
          </mesh>
          <mesh position={[0, scale.avatarHeight - 0.27, 0]} material={materials.mannequin} castShadow><sphereGeometry args={[0.27, 16, 12]} /></mesh>
        </group>
      ))}
    </group>
  );
}
