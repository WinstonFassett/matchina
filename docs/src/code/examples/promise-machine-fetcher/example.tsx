import { MachineVisualizer } from "@components/MachineVisualizer";
import { usePromiseFetcher } from "./hooks";
import { PromiseFetcherView } from "./PromiseFetcherView";

export default function PromiseFetcherExample() {
  const { machine, reset } = usePromiseFetcher();

  return (
    <MachineVisualizer
      machine={machine as any}
      AppView={(props: any) => (
        <PromiseFetcherView {...props} onReset={reset} />
      )}
      showRawState={true}
      defaultViz="mermaid-statechart"
      interactive={false}
    />
  );
}
