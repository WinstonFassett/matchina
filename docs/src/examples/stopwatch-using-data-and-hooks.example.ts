import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/stopwatch-using-data-and-hooks/machine.ts?raw";
import viewRaw from "../code/examples/stopwatch-using-data-and-hooks/StopwatchView.tsx?raw";
import indexRaw from "../code/examples/stopwatch-using-data-and-hooks/index.tsx?raw";

const meta: ExampleMeta = {
  id: "stopwatch-using-data-and-hooks",
  title: "Stopwatch with Hooks",
  description: "Stopwatch using state data and lifecycle hooks",
  category: "Stopwatch",
  tags: ["state-data", "hooks"],
  order: 2,
  defaultViz: "reactflow",
  getMachine: () => import("../code/examples/stopwatch-using-data-and-hooks/machine").then((m) => ({ default: m.createStopwatchMachine })),
  getAppView: () => import("../code/examples/stopwatch-using-data-and-hooks/StopwatchView").then((m) => ({ default: m.StopwatchView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
