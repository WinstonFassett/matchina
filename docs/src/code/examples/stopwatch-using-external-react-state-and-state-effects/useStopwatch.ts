import { useMachine } from "matchina/react";
import { useEffect, useState } from "react";
import { useEventTypeEffect, useStateEffects } from "../lib/matchina-hooks";
import { createStopwatchMachine } from "./machine";

export const useStopwatch = () => {
  const [elapsed, setElapsed] = useState(0);
  const [stopwatch] = useState(() =>
    createStopwatchMachine(elapsed, setElapsed)
  );

  useEffect(() => {
    stopwatch.elapsed = elapsed;
  }, [elapsed]);

  useMachine(stopwatch);
  const state = stopwatch.getState();
  const lastChange = stopwatch.getChange();
  useStateEffects(state);
  useEventTypeEffect(lastChange, stopwatch.effects);
  return stopwatch;
};
