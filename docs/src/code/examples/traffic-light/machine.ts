import { defineStates, matchina } from "matchina";

const states = defineStates({
  Green: () => ({ message: "Go" }),
  Yellow: () => ({ message: "Prepare to stop" }),
  Red: () => ({ message: "Stop" }),
});

export const createTrafficLightMachine = () => {
  return matchina(
    states,
    {
      Green: { next: "Yellow" },
      Yellow: { next: "Red" },
      Red: { next: "Green" },
    },
    "Red",
  );
};

export type TrafficLightMachine = ReturnType<typeof createTrafficLightMachine>;
