import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useState } from "react";
import { RPSAppView } from "./RPSAppView";
import { createRPSMachine } from "./machine";

export default function RockPaperScissorsExample() {
  const [machine] = useState(() => createRPSMachine());
  return (
    <MachineExampleWithChart
      machine={machine as any}
      AppView={RPSAppView}
      showRawState={true}
    />
  );
}
