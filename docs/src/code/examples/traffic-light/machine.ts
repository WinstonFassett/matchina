import { defineStates, matchina } from "matchina";

const states = defineStates({
  Red: undefined,
  Yellow: undefined,
  Green: undefined,
});

export const createTrafficLightMachine = () => {
  return matchina(
    states,
    {
      Red: { next: "Green" },
      Green: { next: "Yellow" },
      Yellow: { next: "Red" },
    },
    "Red"
  );
};

export type TrafficLightMachine = ReturnType<typeof createTrafficLightMachine>;
