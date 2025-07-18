import { useMemo } from "react";
import { ExtendedTrafficLightView } from "./TrafficLightView";
import { createExtendedTrafficLightMachine } from "./machine";

export function ExtendedTrafficLightDemo() {
  const machine = useMemo(createExtendedTrafficLightMachine, []);
  return <ExtendedTrafficLightView machine={machine} />;
}
