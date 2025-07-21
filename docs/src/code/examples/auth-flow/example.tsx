import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMemo } from "react";
import { AuthFlowView } from "./AuthFlowView";
import { createAuthMachine } from "./machine";

export default function AuthFlowExample() {
  const machine = useMemo(createAuthMachine, []);
  return (
    <MachineExampleWithChart
      machine={machine as any}
      AppView={AuthFlowView}
      showRawState={true}
    />
  );
}
