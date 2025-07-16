import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { StopwatchApp } from "../components/StopwatchApp";
import { createStopwatchMachine } from "./machine";

// Main export for importing in MDX documentation
export default function StopwatchExample() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  useMachine(stopwatch.machine);
  return <MachineExampleWithChart machine={stopwatch} AppView={StopwatchApp} showRawState={true} />;
}

// Named export for backward compatibility
export function Stopwatch() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  useMachine(stopwatch.machine);
  return <StopwatchApp machine={stopwatch} />;
}
