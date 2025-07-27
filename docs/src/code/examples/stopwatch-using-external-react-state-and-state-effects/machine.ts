import { createMachine, defineStates, zen } from "matchina";
import { tickEffect } from "../lib/tick-effect";

export const createStopwatchMachine = (
  elapsed: number,
  setElapsed: (elapsed: number) => void
) => {
  const effects = {
    clear: () => setElapsed(0),
    run: () => {
      let lastTick = Date.now();
      return tickEffect(() => {
        const now = Date.now();
        setElapsed(stopwatch.elapsed + now - lastTick);
        lastTick = now;
      });
    },
  };

  const states = defineStates({
    Stopped: { effects: [effects.clear] },
    Ticking: { effects: [effects.run] },
    Suspended: {},
  });

  const stopwatch = Object.assign(
    zen(
      createMachine(
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
      )
    ),
    {
      elapsed,
      effects,
    }
  );

  return stopwatch;
};
