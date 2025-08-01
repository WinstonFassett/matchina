import { useMemo } from "react";
import { StopwatchView } from "./StopwatchView";
import { createStopwatchMachine } from "./machine";

export function Stopwatch() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  return <StopwatchView machine={stopwatch as any} />;
}
