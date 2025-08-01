import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { createStopwatchMachine } from "./machine";
import { StopwatchView } from "./StopwatchView";

export default function StopwatchExample() {
  const stopwatch = createStopwatchMachine();
  return (
    <MachineExampleWithChart
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
    />
  );
}
