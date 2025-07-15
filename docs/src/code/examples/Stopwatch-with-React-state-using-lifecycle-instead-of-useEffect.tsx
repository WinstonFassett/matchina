import { onLifecycle, when } from "matchina";
import { useEffect, useMemo, useState } from "react";

import { facade } from "matchina";
import { useMachine } from "matchina/react";
import { StopwatchDevView, tickEffect } from "./StopwatchCommon";

function useStopwatch() {
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);
  // Define the state machine
  const stopwatch = useMemo(
    () =>
      Object.assign(
        facade(
          {
            Stopped: {},
            Ticking: {},
            Suspended: {},
          },
          {
            Stopped: {
              start: "Ticking",
            },
            Ticking: {
              stop: "Stopped",
              suspend: "Suspended",
              clear: "Ticking",
            },
            Suspended: {
              stop: "Stopped",
              resume: "Ticking",
              clear: "Suspended",
            },
          },
          "Stopped",
        ),
        {
          startTime,
          elapsed,
        },
      ),
    [],
  );
  useEffect(
    () =>
      onLifecycle(stopwatch.machine, {
        "*": {
          enter: when(
            (ev) => ev.to.is("Ticking"),
            () =>
              tickEffect(() => {
                setElapsed(Date.now() - (stopwatch.startTime ?? 0));
              }),
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
    [stopwatch],
  );
  useMachine(stopwatch.machine);
  stopwatch.startTime = startTime;
  stopwatch.elapsed = elapsed;
  return stopwatch;
}

export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchDevView stopwatch={stopwatch} />;
}
