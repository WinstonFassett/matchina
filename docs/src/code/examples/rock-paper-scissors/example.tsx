import { useState } from "react";
import { useMachine } from "matchina/react";
import { createRPSMachine } from "./machine";
import { RPSAppView } from "./RPSAppView";
import { MachineVisualizer } from "@components/MachineVisualizer";

export default function RockPaperScissorsExample() {
  const [machine] = useState(() => createRPSMachine());

  // Subscribe to machine state changes to trigger re-renders
  useMachine(machine);

  return (
    <div className="space-y-6">
      <RPSAppView machine={machine} />
      
      <MachineVisualizer
        machine={machine}
        title="State Machine Visualizer"
        defaultViz="reactflow"
        interactive={false}
        layout="stacked"
      />
    </div>
  );
}
