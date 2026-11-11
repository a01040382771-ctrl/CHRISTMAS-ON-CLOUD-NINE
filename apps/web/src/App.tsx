import { Game } from "./game/Game";
import { EntryScreen } from "./ui/EntryScreen";
import { Hud } from "./ui/Hud";

export default function App() {
  return (
    <>
      <Game />
      <EntryScreen />
      <Hud />
    </>
  );
}
