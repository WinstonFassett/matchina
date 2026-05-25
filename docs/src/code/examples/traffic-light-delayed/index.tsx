import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { createTrafficLight } from "./machine";

type TrafficLightMachine = ReturnType<typeof createTrafficLight>;

export const TrafficLight = ({ machine }: { machine?: TrafficLightMachine } = {}) => {
  const fallback = useMemo(() => createTrafficLight(), []);
  const light = machine ?? fallback;
  useMachine(light);
  const state = light.getState();
  return (
    <button
      title="Click to Change"
      className={`rounded px-3 py-2 text-white ${state.match({
        Red: () => "bg-red-500",
        Yellow: () => "bg-yellow-500",
        Green: () => "bg-green-500",
      })}`}
      onClick={() => light.next()}
    >
      {state.key} {state.data}
    </button>
  );
};
