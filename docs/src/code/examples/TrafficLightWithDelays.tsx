import { effect, facade, setup, when } from "matchina";
import { useMachine } from "matchina/react";
import { tickEffect } from "./stopwatch-common/tick-effect";

// ---cut---
export const trafficLight = facade(
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

export const TrafficLight = () => {
  useMachine(trafficLight.machine);
  const { state } = trafficLight;
  return (
    <button
      title="Click to Change"
      className={`rounded ${trafficLight.state.match({
        Red: () => "bg-red-500",
        Yellow: () => "bg-yellow-500",
        Green: () => "bg-green-500",
      })}`}
      onClick={() => trafficLight.next()}
    >
      {state.key} {state.data}
    </button>
  );
};
