import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { StopwatchView } from "./StopwatchView";
import { createStopwatchMachine } from "./machine";

// Main export for importing in MDX documentation
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

// Named export for backward compatibility
export function Stopwatch() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  useMachine(stopwatch.machine);
  return <StopwatchView machine={stopwatch} />;
}
