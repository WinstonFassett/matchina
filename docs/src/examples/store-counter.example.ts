import type { ExampleMeta } from "./types";
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
  getMachine: () =>
    import("../code/examples/store-counter/store").then((m) => ({
      default: m.createCounterStore,
    })),
  getAppView: () =>
    import("../code/examples/store-counter/StoreCounterView").then((m) => ({
      default: m.StoreCounterView,
    })),
  getSourceFiles: async () => [
    { name: "store.ts", code: storeRaw },
    { name: "StoreCounterView.tsx", code: viewRaw },
  ],
};

export default meta;
