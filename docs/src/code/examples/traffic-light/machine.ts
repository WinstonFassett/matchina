import { defineStates, matchina } from "matchina";

const states = defineStates({
  Red: () => ({ message: "Stop" }),
  Yellow: () => ({ message: "Prepare to stop" }),
  Green: () => ({ message: "Go" }),
});

export const createTrafficLightMachine = () => {
  return matchina(
    states,
    {
      Red: { next: "Green" },
      Yellow: { next: "Red" },
      Green: { next: "Yellow" },
    },
    "Red"
  );
};

export type TrafficLightMachine = ReturnType<typeof createTrafficLightMachine>;
