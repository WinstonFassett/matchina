import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { createTrafficLight } from "./machine";
import { TrafficLight } from "./index";

export default function TrafficLightExample() {
  const trafficLight = createTrafficLight();

  return (
    <div>
      <TrafficLight />
    </div>
  );
}
