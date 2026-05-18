import { useMachine } from "matchina/react";
import { useEffect, useState } from "react";
import { createStopwatchMachine } from "./machine";

export const useStopwatch = () => {
  const [elapsed, setElapsed] = useState(0);
  const [stopwatch] = useState(() =>
    createStopwatchMachine(elapsed, setElapsed)
  );

  useMachine(stopwatch);
  const state = stopwatch.getState();
  useEffect(() => {
    const fns: (() => (() => void) | void)[] = (state.data as any)?.effects ?? [];
    const cleanups = fns.map((fn) => fn()).filter(Boolean) as (() => void)[];
    return () => cleanups.forEach((fn) => fn());
  }, [state]);
  stopwatch.elapsed = elapsed;
  return stopwatch;
};
