import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useSumFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

export default function FetcherExample() {
  const fetcher = useSumFetcher();

  return (
    <MachineExampleWithChart
      machine={fetcher}
      AppView={FetcherAppView}
      showRawState={true}
    />
  );
}
