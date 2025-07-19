import { useMemo } from "react";
import { StopwatchView } from "./StopwatchView";
import { createStopwatchMachine } from "./machine";

// Named export for backward compatibility
export function Stopwatch() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  return <StopwatchView machine={stopwatch} />;
}
