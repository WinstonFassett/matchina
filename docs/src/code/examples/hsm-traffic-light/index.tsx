import { useMemo } from "react";
import { TrafficLightViewNested } from "./TrafficLightViewNested";
import { createPropagatingTrafficLight } from "./machine";

export function HsmTrafficLightDemo() {
  const machine = useMemo(createPropagatingTrafficLight, []);
  return <TrafficLightViewNested machine={machine} />;
}
