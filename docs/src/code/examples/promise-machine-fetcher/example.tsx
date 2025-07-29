import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { usePromiseFetcher } from "./hooks";
import { PromiseFetcherView } from "./PromiseFetcherView";

export default function PromiseFetcherExample() {
  const { machine, reset } = usePromiseFetcher();

  return (
    <MachineExampleWithChart
      machine={machine as any}
      AppView={(props: any) => (
        <PromiseFetcherView {...props} onReset={reset} />
      )}
      showRawState={true}
    />
  );
}
