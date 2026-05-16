import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/counter/machine.ts?raw";
import viewRaw from "../code/examples/counter/CounterView.tsx?raw";
import indexRaw from "../code/examples/counter/index.tsx?raw";

const meta: ExampleMeta = {
  id: "counter",
  title: "Counter State Machine",
  description: "A counter example with state data",
  category: "Basic",
  tags: ["createMachine", "state-data"],
  order: 2,
  hideVizPicker: true,
  docSlug: "learn/examples/counter",
  getMachine: () => import("../code/examples/counter/machine").then((m) => ({ default: m.createCounterMachine })),
  getAppView: () => import("../code/examples/counter/CounterView").then((m) => ({ default: m.CounterView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "CounterView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
