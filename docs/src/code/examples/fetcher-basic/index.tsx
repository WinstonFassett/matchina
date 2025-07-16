import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useSumFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

// Main export for importing in MDX documentation
export default function FetcherExample() {
  const fetcher = useSumFetcher();
  return <MachineExampleWithChart machine={fetcher} AppView={FetcherAppView} showRawState={true} />;
}

// For backward compatibility
export function Fetcher() {
  const fetcher = useSumFetcher();
  return <FetcherAppView machine={fetcher} />;
}
