import { useAdvancedFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

// For backward compatibility
export function FetcherDemo() {
  const fetcher = useAdvancedFetcher();
  return <FetcherAppView machine={fetcher} />;
}
