import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { StopwatchView } from "./StopwatchView";
import { useStopwatch } from "./useStopwatch";

export default function StopwatchExample() {
  const stopwatch = useStopwatch();
  return (
    <MachineExampleWithChart
      machine={stopwatch}
      AppView={StopwatchView}
      showRawState={true}
    />
  );
}
