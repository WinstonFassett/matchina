import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

export default function FetcherExample() {
  const fetcher = useFetcher();

  return (
    <MachineExampleWithChart
      machine={fetcher as any}
      AppView={FetcherAppView}
      showRawState={true}
    />
  );
}
