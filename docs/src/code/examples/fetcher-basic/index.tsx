import { FetcherAppView } from "./FetcherAppView";
import { useFetcher } from "./hooks";

// For backward compatibility
export function Fetcher() {
  const fetcher = useFetcher("https://httpbin.org/delay/1", {
    method: "GET",
  });
  return <FetcherAppView machine={fetcher} />;
}
