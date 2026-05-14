import { MachineVisualizer } from "@components/MachineVisualizer";
import { useMemo } from "react";
import { createLandingFetcherMachine } from "./machine";

function NoView() { return null; }

export function HeroCardViz() {
  const machine = useMemo(createLandingFetcherMachine, []);
  return (
    <MachineVisualizer
      machine={machine as any}
      AppView={NoView}
      defaultViz="reactflow"
      showPicker={true}
      interactive={false}
      layout="stacked"
      minVizHeight={220}
    />
  );
}
