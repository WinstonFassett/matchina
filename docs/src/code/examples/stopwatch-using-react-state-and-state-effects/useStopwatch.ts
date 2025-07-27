import { defineStates, createMachine, zen } from "matchina";
import { useMachine } from "matchina/react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useStateEffects, useEventTypeEffect } from "../lib/matchina-hooks";
import { tickEffect } from "../lib/tick-effect";

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);

  const effects = useMemo(
    () => ({
      clear: () => setElapsed(0),
      run: () => {
        let lastTick = Date.now();
        return tickEffect(() => {
          const now = Date.now();
          setElapsed(stopwatch.elapsed + now - lastTick);
          lastTick = now;
        });
      },
    }),
    []
  );

  // Define the state machine
  const stopwatch = useMemo(() => {
    // Define states using defineStates
    const states = defineStates({
      Stopped: { effects: [effects.clear] },
      Ticking: { effects: [effects.run] },
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
      elapsed,
    });
  }, []);

  useMachine(stopwatch);
  useStateEffects(stopwatch.getState());
  useEventTypeEffect(stopwatch.getChange(), effects);
  stopwatch.elapsed = elapsed;
  return stopwatch;
}
