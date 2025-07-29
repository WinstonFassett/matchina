import { useMemo } from "react";
import { ToggleView } from "./ToggleView";
import { createToggleMachine } from "./machine";

export function ToggleDemo() {
  const machine = useMemo(createToggleMachine, []);
  return <ToggleView machine={machine} />;
}
