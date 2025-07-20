import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useAsyncCalculator } from "./hooks";
import { AsyncCalculatorView } from "./AsyncCalculatorView";

export default function AsyncCalculatorExample() {
  const calculator = useAsyncCalculator();

  return (
    <MachineExampleWithChart
      machine={calculator as any}
      AppView={AsyncCalculatorView}
      showRawState={true}
    />
  );
}
