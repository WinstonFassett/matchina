import { useMemo } from "react";
import { eventApi } from "matchina";
import { createTrafficLightMachine } from "./machine";
import { TrafficLightView } from "./TrafficLightView";
import { VisualizerDemo } from "@components/HSMVisualizerDemo";

export default function TrafficLightFlatExample() {
  const machine = useMemo(() => createTrafficLightMachine(), []);
  const actions = useMemo(() => eventApi(machine), [machine]);

  return (
    <div className="space-y-6">
      <TrafficLightView machine={machine} />
      <VisualizerDemo
        machine={machine}
        actions={actions}
        title="State Machine Visualizers"
        defaultVisualizer="sketch"
        interactive={true}
      />
    </div>
  );
}
