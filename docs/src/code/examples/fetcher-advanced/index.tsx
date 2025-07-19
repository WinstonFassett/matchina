import { useAdvancedFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";

export function FetcherDemo() {
  const fetcher = useAdvancedFetcher("https://httpbin.org/delay/1", {
    method: "GET",
    maxTries: 5,
    timeout: 1200,
    autoretry: true,
  });
  return <FetcherAppView machine={fetcher} />;
}
