import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMemo } from "react";
import { ComboboxView } from "./ComboboxView";
import { createComboboxMachine } from "./machine";

export default function ComboboxExample() {
  const machine = useMemo(createComboboxMachine, []);
  return (
    <MachineExampleWithChart
      machine={machine as any}
      AppView={ComboboxView}
      inspectorType="picker"
      interactive={true}
    />
  );
}
