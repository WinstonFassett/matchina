import { createTrafficLight } from "./machine";

const trafficLight = createTrafficLight();

export const TrafficLight = () => {
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
