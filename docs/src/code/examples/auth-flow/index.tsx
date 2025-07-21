import { useState } from "react";
import { AuthFlowView } from "./AuthFlowView";
import { createAuthMachine } from "./machine";

export function AuthFlowDemo() {
  const [machine] = useState(createAuthMachine);
  return <AuthFlowView machine={machine} />;
}
