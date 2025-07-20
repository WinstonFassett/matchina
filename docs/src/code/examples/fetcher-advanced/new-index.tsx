import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useAdvancedFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

// Main export for importing in MDX documentation
export default function FetcherExample() {
  const fetcher = useAdvancedFetcher();
  return (
    <MachineExampleWithChart
      machine={fetcher as any}
      AppView={FetcherAppView}
      showRawState={true}
    />
  );
}

// For backward compatibility
export function FetcherDemo() {
  const fetcher = useAdvancedFetcher();
  return <FetcherAppView machine={fetcher} />;
}
