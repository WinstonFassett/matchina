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
      Yellow: { next: "Red" },
      Green: { next: "Yellow" },
    },
    "Red"
  );
};

export type TrafficLightMachine = ReturnType<typeof createTrafficLightMachine>;
