import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { ExtendedTrafficLightView } from "./TrafficLightView";
import { createExtendedTrafficLightMachine } from "./machine";

export function ExtendedTrafficLightDemo() {
  const machine = useMemo(createExtendedTrafficLightMachine, []);
  useMachine(machine);
  return <ExtendedTrafficLightView machine={machine} />;
}
