import { defineStates, createMachine, zen } from "matchina";
import { useMachine } from "matchina/react";
import { useState, useMemo, useEffect } from "react";
import { tickEffect } from "../lib/tick-effect";

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const effects = useMemo(
    () => ({
      run: () => {
        let lastTick = Date.now();
        return tickEffect(() => {
          const now = Date.now();
          setElapsed(stopwatch.elapsed + now - lastTick);
          lastTick = now;
        });
      },
      clear: () => {
        setElapsed(0);
      },
    }),
    [],
  );

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
      "Stopped",
    );

    // Use zen to enhance the machine with utility methods
    return Object.assign(zen(baseMachine), {
      elapsed: elapsed,
      setElapsed: setElapsed,
    });
  }, []);

  stopwatch.elapsed = elapsed;
  useMachine(stopwatch);
  useEffect(() => {
    if (stopwatch.change.type === "clear") {
      effects.clear();
    }
    return stopwatch.state.match(
      {
        Ticking: effects.run,
        Stopped: () => effects.clear,
      },
      false,
    );
  }, [stopwatch.state]);
  return stopwatch;
}
