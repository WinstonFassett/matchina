import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useAdvancedFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

export default function FetcherExample() {
  const fetcher = useAdvancedFetcher();
  return (
    <MachineExampleWithChart
      machine={fetcher}
      AppView={FetcherAppView}
      showRawState={true}
    />
  );
}
