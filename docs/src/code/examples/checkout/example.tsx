import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMemo } from "react";
import { CheckoutView } from "./CheckoutView";
import { createCheckoutMachine } from "./machine";

export default function CheckoutExample() {
  const machine = useMemo(createCheckoutMachine, []);
  return (
    <MachineExampleWithChart
      machine={machine as any}
      AppView={CheckoutView}
      showRawState={true}
    />
  );
}
