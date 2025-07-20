import { FetcherAppView } from "./FetcherAppView";
import { useFetcher } from "./hooks";

export function Fetcher() {
  const fetcher = useFetcher();
  return <FetcherAppView machine={fetcher} />;
}
