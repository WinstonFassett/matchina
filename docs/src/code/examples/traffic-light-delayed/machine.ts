import { facade, setup, effect, when } from "matchina";
import { tickEffect } from "../lib/tick-effect";

// ---cut---

export const createTrafficLight = () => {
  const trafficLight = facade(
    {
      Red: () => "means stop",
      Green: () => "means go",
      Yellow: () => "means caution",
    },
    {
      Red: { next: "Green" },
      Green: { next: "Yellow" },
      Yellow: { next: "Red" },
    },
    "Red",
  );
  setup(trafficLight.machine)(
    effect(
      when(
        (_ev) => true,
        (change) =>
          tickEffect(
            trafficLight.next,
            change.to.match({
              Red: () => 2000,
              Green: () => 2000,
              Yellow: () => 1000,
            }),
          ),
      ),
    ),
  );
  trafficLight.next();
  return trafficLight;
};
