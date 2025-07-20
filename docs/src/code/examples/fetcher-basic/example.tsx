import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

export default function FetcherExample() {
  const { fetcher, reset } = useFetcher();

  return (
    <MachineExampleWithChart
      machine={fetcher as any}
      AppView={(props: any) => <FetcherAppView {...props} onReset={reset} />}
      showRawState={true}
    />
  );
}
