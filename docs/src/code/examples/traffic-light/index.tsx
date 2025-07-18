import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { TrafficLightView } from "./TrafficLightView";
import { createTrafficLightMachine } from "./machine";

export function TrafficLightDemo() {
  const machine = useMemo(createTrafficLightMachine, []);
  useMachine(machine);
  return <TrafficLightView machine={machine} />;
}
