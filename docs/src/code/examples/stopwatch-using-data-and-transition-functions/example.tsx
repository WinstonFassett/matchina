import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMemo } from "react";
import { createStopwatchMachine } from "./machine";
import { StopwatchView } from "./StopwatchView";

export default function StopwatchExample() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  return (
    <MachineExampleWithChart
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
    />
  );
}
