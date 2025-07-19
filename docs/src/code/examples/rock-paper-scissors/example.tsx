import React, { useMemo } from "react";
import { RPSAppView } from "./RPSAppView";
import { createRPSMachine } from "./machine";
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";

export default function RockPaperScissorsExample() {
  // Create the machine
  const game = useMemo(() => createRPSMachine(), []);

  return (
    <MachineExampleWithChart
      machine={game}
      AppView={RPSAppView}
      showRawState={true}
    />
  );
}
