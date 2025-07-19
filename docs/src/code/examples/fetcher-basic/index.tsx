import { useSumFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

// For backward compatibility
export function Fetcher() {
  const fetcher = useSumFetcher();
  return <FetcherAppView machine={fetcher} />;
}
