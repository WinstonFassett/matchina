import { onLifecycle, when } from "matchina";
import { useMachine } from "matchina/react";
import { useState, useMemo, useEffect } from "react";
import { tickEffect } from "../lib/tick-effect";
import { createStopwatch } from "./machine";

export function useStopwatch() {
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);
  // Define the state machine
  const stopwatch = useMemo(
    () =>
      Object.assign(createStopwatch(), {
        startTime,
        elapsed,
      }),
    []
  );
  useEffect(
    () =>
      onLifecycle(stopwatch, {
        "*": {
          enter: when(
            (ev) => ev.to.is("Ticking"),
            () =>
              tickEffect(() => {
                setElapsed(Date.now() - (stopwatch.startTime ?? 0));
              })
          ),
          on: {
            start: {
              effect: () => {
                setStartTime(Date.now());
              },
            },
            clear: { effect: () => setElapsed(0) },
            stop: { effect: () => setElapsed(0) },
            resume: {
              effect: () => setStartTime(Date.now() - (stopwatch.elapsed ?? 0)),
            },
          },
        },
        Ticking: {
          on: {
            clear: {
              effect() {
                setStartTime(Date.now());
              },
            },
          },
        },
        Suspended: {
          on: {
            clear: {
              effect() {
                setStartTime(undefined);
              },
            },
          },
        },
      }),
    [stopwatch]
  );
  useMachine(stopwatch);
  stopwatch.startTime = startTime;
  stopwatch.elapsed = elapsed;
  return stopwatch;
}
