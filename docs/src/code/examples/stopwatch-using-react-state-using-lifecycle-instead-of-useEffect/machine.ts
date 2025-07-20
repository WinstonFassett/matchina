import { defineStates, createMachine, zen } from "matchina";

export const createStopwatch = () => {
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
  return zen(baseMachine);
};
