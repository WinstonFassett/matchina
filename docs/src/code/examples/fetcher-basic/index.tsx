import { FetcherAppView } from "./FetcherAppView";
import { useFetcher } from "./hooks";

export function Fetcher() {
  const { machine, reset } = useFetcher();
  return <FetcherAppView machine={machine} onReset={reset} />;
}
