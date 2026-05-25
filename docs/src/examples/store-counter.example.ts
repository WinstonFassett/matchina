import type { ExampleMeta } from "./types";
import { createCounterStore } from "../code/examples/store-counter/store";
import { StoreCounterView } from "../code/examples/store-counter/StoreCounterView";
import storeRaw from "../code/examples/store-counter/store.ts?raw";
import viewRaw from "../code/examples/store-counter/StoreCounterView.tsx?raw";

const meta: ExampleMeta = {
  id: "store-counter",
  title: "Store Counter",
  description: "A store machine with type-safe dispatch actions",
  category: "Basic",
  tags: ["createStoreMachine", "dispatch"],
  order: 3,
  kind: "store",
  docSlug: "guides/store-machine",
  machineFactory: createCounterStore,
  AppView: StoreCounterView,
  getSourceFiles: async () => [
    { name: "store.ts", code: storeRaw },
    { name: "StoreCounterView.tsx", code: viewRaw },
  ],
};

export default meta;
