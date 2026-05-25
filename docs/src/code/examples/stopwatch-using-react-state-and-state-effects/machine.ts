import { createMachine, defineStates, assignEventApi } from "matchina";

/**
 * Standalone factory used by the docs visualizer to render the state graph.
 * The runtime example uses `useStopwatch` which constructs the same machine
 * inline with React-managed `elapsed` state and per-state effects.
 */
export const createStopwatchMachine = () => {
  const states = defineStates({
    Stopped: {},
    Ticking: {},
    Suspended: {},
  });
  return assignEventApi(
    createMachine(
      states,
      {
        Stopped: { start: "Ticking" },
        Ticking: { stop: "Stopped", suspend: "Suspended", clear: "Ticking" },
        Suspended: { stop: "Stopped", resume: "Ticking", clear: "Suspended" },
      },
      "Stopped"
    )
  );
};
