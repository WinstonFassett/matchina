import { useMemo } from "react";
import { AuthFlowView } from "./AuthFlowView";
import { createAuthMachine } from "./machine";

export function AuthFlowDemo() {
  const machine = useMemo(createAuthMachine, []);
  return <AuthFlowView machine={machine} />;
}
