import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMemo } from "react";
import { BalancedParenthesesDemo } from "./index";
import { balancedParenthesesChecker } from "./machine";

export default function BalancedParenthesesExample() {
  const checker = useMemo(() => balancedParenthesesChecker(), []);
  
  return (
    <div>
      <BalancedParenthesesDemo />
    </div>
  );
}
