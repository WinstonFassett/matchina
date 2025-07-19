import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { StopwatchView } from "./StopwatchView";
import { createStopwatchMachine } from "./machine";

export default function StopwatchExample() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  useMachine(stopwatch.machine);
  return (
    <MachineExampleWithChart
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
    />
  );
}
