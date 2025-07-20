import { useState } from "react";
import { RPSAppView } from "./RPSAppView";
import { createRPSMachine } from "./machine";

export function RockPaperScissors() {
  const [game] = useState(() => createRPSMachine());
  return <RPSAppView machine={game} />;
}
