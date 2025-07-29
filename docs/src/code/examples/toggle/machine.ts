import { createMachine, defineStates, withApi } from "matchina";

export const createToggleMachine = () => {
  const states = defineStates({
    On: () => ({}),
    Off: () => ({}),
  });

  // Create a machine with proper transitions
  const machine = withApi(
    createMachine(
      states,
      {
        On: {
          toggle: "Off",
          turnOff: "Off",
        },
        Off: {
          toggle: "On",
          turnOn: "On",
        },
      },
      states.Off() // Start in the Off state
    )
  );

  return machine;
};

export type ToggleMachine = ReturnType<typeof createToggleMachine>;
