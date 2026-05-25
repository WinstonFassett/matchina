import type { ExampleMeta } from "./types";
import { createFetcher } from "../code/examples/fetcher-advanced/machine";
import { FetcherAppView } from "../code/examples/fetcher-advanced/FetcherAppView";
import machineRaw from "../code/examples/fetcher-advanced/machine.ts?raw";
import hooksRaw from "../code/examples/fetcher-advanced/hooks.ts?raw";
import viewRaw from "../code/examples/fetcher-advanced/FetcherAppView.tsx?raw";
import indexRaw from "../code/examples/fetcher-advanced/index.tsx?raw";

const meta: ExampleMeta = {
  id: "fetcher-advanced",
  title: "Advanced Fetcher",
  description: "Advanced data fetching with cancellation and retry logic",
  category: "Fetcher",
  tags: ["promise-machine", "async", "fetcher"],
  order: 2,
  docSlug: "learn/examples/fetcher-advanced",
  machineFactory: () => createFetcher("https://jsonplaceholder.typicode.com/todos/1"),
  AppView: FetcherAppView,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "hooks.ts", code: hooksRaw },
    { name: "FetcherAppView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
