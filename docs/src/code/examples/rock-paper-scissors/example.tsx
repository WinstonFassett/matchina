import { useMemo, useState } from "react";
import { eventApi } from "matchina";
import { useMachine } from "matchina/react";
import { createRPSMachine } from "./machine";
import { RPSAppView } from "./RPSAppView";
import { VisualizerDemo } from "@components/HSMVisualizerDemo";

export default function RockPaperScissorsExample() {
  const [machine] = useState(() => createRPSMachine());
  const actions = useMemo(() => eventApi(machine), [machine]);
  
  // Subscribe to machine state changes to trigger re-renders
  useMachine(machine);

  return (
    <div className="space-y-6">
      <RPSAppView machine={machine} />
      
      <VisualizerDemo
        machine={machine}
        actions={actions}
        title="State Machine Visualizer"
        defaultVisualizer="reactflow"
        interactive={false}
      />
    </div>
  );
}
