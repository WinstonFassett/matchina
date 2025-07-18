import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { ToggleView } from "./ToggleView";
import { createToggleMachine } from "./machine";

export function ToggleDemo() {
  const machine = useMemo(createToggleMachine, []);
  useMachine(machine);
  return <ToggleView machine={machine} />;
}
