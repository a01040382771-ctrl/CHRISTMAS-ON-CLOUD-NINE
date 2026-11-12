import { ArrivalDeck } from "./bridges/ArrivalDeck";
import { Bridge } from "./bridges/Bridge";
import { zoneComponents } from "./buildings/registry";
import { Clouds } from "./environment/Clouds";
import { Lighting } from "./environment/Lighting";
import { treeSpots } from "./environment/scatter";
import { Sky } from "./environment/Sky";
import { bridges, docks, islands, lotsOf, zones } from "./layout";
import { CliffFence } from "./props/CliffFence";
import { LampPosts } from "./props/LampPosts";
import { lampSpots } from "./props/lampPlacement";
import { Pines } from "./props/Pines";
import { ScaleFigures } from "./props/ScaleFigures";
import { ZoneLabelProjector } from "./props/ZoneLabels";
import { FloatingIsland } from "./terrain/FloatingIsland";
import { Walkways } from "./terrain/Walkways";

interface Props {
  showLabels: boolean;
  showScale: boolean;
  /** Hide zone tags further than this (explore mode keeps only nearby ones). */
  labelDistance?: number;
}

/**
 * The whole sky village, assembled from the layout:
 * environment → islands → walkways → bridges → zones → shared props.
 */
export function World({ showLabels, showScale, labelDistance }: Props) {
  return (
    <>
      <Sky />
      <Lighting />
      <Clouds />

      {islands.map((def) => <FloatingIsland key={def.id} def={def} />)}
      {islands.filter((def) => def.kind !== "decor").map((def) => <CliffFence key={def.id} def={def} />)}
      <Walkways />
      {bridges.map((b) => <Bridge key={b.id} bridge={b} />)}
      {docks.map((d) => <ArrivalDeck key={d.id} dock={d} />)}

      {zones.map((zone) => {
        const Zone = zoneComponents[zone.id];
        return <Zone key={zone.id} lots={lotsOf(zone.id)} />;
      })}

      <Pines spots={treeSpots} />
      <LampPosts spots={lampSpots} />

      {showLabels && <ZoneLabelProjector maxDistance={labelDistance} />}
      {showScale && <ScaleFigures />}
    </>
  );
}
