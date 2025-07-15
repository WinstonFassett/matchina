import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { StopwatchDevView } from "../stopwatch-common/StopwatchDevView";
import { createStopwatch } from "./machine";

export function Stopwatch() {
  const stopwatch = useMemo(createStopwatch, []);
  useMachine(stopwatch.machine);
  return <StopwatchDevView stopwatch={stopwatch} />;
}

