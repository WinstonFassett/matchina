import { MachineVisualizer } from "@components/MachineVisualizer";
import { useState } from "react";
import { AuthFlowView } from "./AuthFlowView";
import { createAuthMachine } from "./machine";

export default function AuthFlowExample() {
  const [machine] = useState(createAuthMachine);
  return (
    <MachineVisualizer
      machine={machine as any}
      AppView={AuthFlowView}
      showRawState={true}
      defaultViz="reactflow"
      interactive={false}
    />
  );
}
