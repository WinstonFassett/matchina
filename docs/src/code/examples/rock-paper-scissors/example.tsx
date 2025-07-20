import React, { useMemo } from "react";
import { RPSAppView } from "./RPSAppView";
import { createRPSMachine } from "./machine";
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";

export default function RockPaperScissorsExample() {
  const machine = useMemo(() => createRPSMachine(), []);
  return (
    <MachineExampleWithChart
      machine={machine as any}
      AppView={RPSAppView}
      showRawState={true}
    />
  );
}
