import type { ExampleMeta } from "./types";
import { createPromiseFetcherMachine } from "../code/examples/promise-machine-fetcher/machine";
import { FetcherAppView } from "../code/examples/promise-machine-fetcher/FetcherAppView";
import machineRaw from "../code/examples/promise-machine-fetcher/machine.ts?raw";
import hooksRaw from "../code/examples/promise-machine-fetcher/hooks.ts?raw";
import viewRaw from "../code/examples/promise-machine-fetcher/FetcherAppView.tsx?raw";
import indexRaw from "../code/examples/promise-machine-fetcher/index.tsx?raw";

const meta: ExampleMeta = {
  id: "promise-machine-fetcher",
  title: "Promise Machine Fetcher",
  description: "Data fetching using promise machines",
  category: "Fetcher",
  tags: ["promise-machine", "async", "fetcher"],
  order: 1,
  docSlug: "learn/examples/promise-machine-fetcher",
  machineFactory: createPromiseFetcherMachine,
  AppView: FetcherAppView,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "hooks.ts", code: hooksRaw },
    { name: "FetcherAppView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
