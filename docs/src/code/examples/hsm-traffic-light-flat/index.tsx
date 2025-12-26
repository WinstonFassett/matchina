import { useMemo } from "react";
import { createTrafficLightMachine } from "./machine";
import { TrafficLightView } from "./TrafficLightView";

export default function TrafficLightFlat() {
  const machine = useMemo(() => createTrafficLightMachine(), []);
  return <TrafficLightView machine={machine} />;
}
