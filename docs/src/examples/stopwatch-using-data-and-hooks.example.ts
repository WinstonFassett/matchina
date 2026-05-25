import type { ExampleMeta } from "./types";
import { createStopwatchMachine } from "../code/examples/stopwatch-using-data-and-hooks/machine";
import { StopwatchView } from "../code/examples/stopwatch-using-data-and-hooks/StopwatchView";
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
  machineFactory: createStopwatchMachine,
  AppView: StopwatchView,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
