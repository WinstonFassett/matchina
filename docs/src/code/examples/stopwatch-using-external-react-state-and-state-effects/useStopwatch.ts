import { useMachine } from "matchina/react";
import { useEffect, useState } from "react";
import { useEventTypeEffect, useStateEffects } from "../lib/matchina-hooks";
import { createStopwatchMachine } from "./machine";

export const useStopwatch = () => {
  const [elapsed, setElapsed] = useState(0);
  const stopwatch = createStopwatchMachine(elapsed, setElapsed);
  
  useEffect(() => {
    stopwatch.elapsed = elapsed;
  }, [elapsed]);
  
  useMachine(stopwatch.machine);
  useStateEffects(stopwatch.state);
  useEventTypeEffect(stopwatch.change, stopwatch.effects);
  
  return stopwatch;
};
