import { defineStates, createMachine, zen, onLifecycle, when } from "matchina";
import { useMachine } from "matchina/react";
import { useEffect, useMemo, useState } from "react";
import { StopwatchDevView } from "./stopwatch-common/StopwatchDevView";
import { tickEffect } from "./lib/tick-effect";

// ---cut---

function useStopwatch() {
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);

  // Define the state machine
  const stopwatch = useMemo(() => {
    // Define states using defineStates
    const states = defineStates({
      Stopped: {},
      Ticking: {},
      Suspended: {},
    });

    // Create the base machine with states, transitions, and initial state
    const baseMachine = createMachine(
      states,
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
      "Stopped"
    );

    // Use zen to enhance the machine with utility methods
    return Object.assign(zen(baseMachine), {
      startTime,
      elapsed,
    });
  }, []);

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

export function Stopwatch() {
  const stopwatch = useStopwatch();
  return <StopwatchDevView stopwatch={stopwatch} />;
}
