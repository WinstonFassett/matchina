import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMemo } from "react";
import { StopwatchView } from "./StopwatchView";
import { createStopwatchMachine } from "./machine";

export default function StopwatchExample() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  return (
    <MachineExampleWithChart
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
      inspectorType="force-graph"
    />
  );
}
