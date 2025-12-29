import { useMemo, useState } from "react";
import { eventApi } from "matchina";
import { createRPSMachine } from "./machine";
import { RPSAppView } from "./RPSAppView";
import { VisualizerDemo } from "@components/HSMVisualizerDemo";

export default function RockPaperScissorsExample() {
  const [machine] = useState(() => createRPSMachine());
  const actions = useMemo(() => eventApi(machine), [machine]);

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
