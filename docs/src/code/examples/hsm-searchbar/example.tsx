import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useMemo } from "react";
import { SearchBarView } from "./SearchBarView";
import { createSearchBarMachine } from "./machine";

export default function SearchBarExample() {
  const machine = useMemo(createSearchBarMachine, []);
  return (
    <MachineExampleWithChart
      machine={machine as any}
      AppView={SearchBarView}
      inspectorType="picker"
      interactive={true}
    />
  );
}
