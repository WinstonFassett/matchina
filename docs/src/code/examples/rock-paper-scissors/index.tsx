import React, { useMemo } from "react";
import { RPSAppView } from "./RPSAppView";
import { createRPSMachine } from "./machine";

// Named export for backward compatibility
export function RockPaperScissors() {
  // Create the machine
  const game = useMemo(() => createRPSMachine(), []);

  return <RPSAppView machine={game} />;
}

// Default export for the examples
export default RockPaperScissors;
