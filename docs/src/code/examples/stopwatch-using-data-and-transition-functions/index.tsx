import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { StopwatchDevView } from "../stopwatch-common/StopwatchDevView";
import { createStopwatchMachine } from "./machine";

export function Stopwatch() {
  const stopwatch = useMemo(createStopwatchMachine, []);
  useMachine(stopwatch.machine);
  return <StopwatchDevView stopwatch={stopwatch} />;
}
