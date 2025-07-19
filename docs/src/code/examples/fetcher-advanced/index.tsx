import { useAdvancedFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

export function FetcherDemo() {
  const fetcher = useAdvancedFetcher();
  return <FetcherAppView machine={fetcher} />;
}
