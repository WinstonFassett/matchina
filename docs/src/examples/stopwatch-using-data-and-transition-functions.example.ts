import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/stopwatch-using-data-and-transition-functions/machine.ts?raw";
import viewRaw from "../code/examples/stopwatch-using-data-and-transition-functions/StopwatchView.tsx?raw";
import indexRaw from "../code/examples/stopwatch-using-data-and-transition-functions/index.tsx?raw";

const meta: ExampleMeta = {
  id: "stopwatch-using-data-and-transition-functions",
  title: "Stopwatch with Transition Functions",
  description: "Stopwatch using state data and transition functions",
  category: "Stopwatch",
  tags: ["state-data", "transition-functions"],
  order: 3,
  defaultViz: "reactflow",
  getMachine: () => import("../code/examples/stopwatch-using-data-and-transition-functions/machine").then((m) => ({ default: m.createStopwatchMachine })),
  getAppView: () => import("../code/examples/stopwatch-using-data-and-transition-functions/StopwatchView").then((m) => ({ default: m.StopwatchView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
