import { PromiseFetcherView } from "./PromiseFetcherView";
import { usePromiseFetcher } from "./hooks";

export function PromiseFetcher() {
  const { machine, reset } = usePromiseFetcher();
  return <PromiseFetcherView machine={machine} onReset={reset} />;
}
