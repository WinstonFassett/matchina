import { useState } from "react";
import { useAdvancedFetcher } from "./hooks";
import { FetcherAppView } from "./FetcherAppView";
import {
  OptionsForm,
  defaultOptions,
  type FetcherOptions,
} from "./OptionsForm";

export function FetcherDemo() {
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
      <FetcherAppView machine={fetcher} />
    </div>
  );
}
