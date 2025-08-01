import { useMemo } from "react";
import { TrafficLightView } from "./TrafficLightView";
import { createTrafficLightMachine } from "./machine";

export function TrafficLightDemo() {
  const machine = useMemo(createTrafficLightMachine, []);
  return <TrafficLightView machine={machine} />;
}
