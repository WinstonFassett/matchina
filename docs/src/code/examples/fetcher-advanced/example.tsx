import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { useState } from "react";
import { useAdvancedFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";
import {
  OptionsForm,
  defaultOptions,
  type FetcherOptions,
} from "./OptionsForm";

export default function FetcherExample() {
  const [options, setOptions] = useState<FetcherOptions>(defaultOptions);

  const fetcher = useAdvancedFetcher(options.url, {
    method: "GET",
    timeout: options.timeout,
    maxTries: options.maxTries,
    autoretry: options.autoretry,
  });

  return (
    <div>
      <OptionsForm options={options} onChange={setOptions} />
      <MachineExampleWithChart
        machine={fetcher as any}
        AppView={FetcherAppView}
        showRawState={true}
        inspectorType="mermaid"
      />
    </div>
  );
}
