import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useState } from "react";
import { AuthFlowView } from "./AuthFlowView";
import { createAuthMachine } from "./machine";

export default function AuthFlowExample() {
  const [machine] = useState(createAuthMachine);
  return (
    <MachineExampleWithChart
      machine={machine as any}
      AppView={AuthFlowView}
      showRawState={true}
      inspectorType="react-flow"
      interactive={false}
    />
  );
}
