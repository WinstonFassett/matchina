import type { ExampleMeta } from "./types";
import { createStopwatchMachine } from "../code/examples/stopwatch/machine";
import { StopwatchView } from "../code/examples/stopwatch/StopwatchView";
import machineRaw from "../code/examples/stopwatch/machine.ts?raw";
import viewRaw from "../code/examples/stopwatch/StopwatchView.tsx?raw";
import indexRaw from "../code/examples/stopwatch/index.tsx?raw";

const meta: ExampleMeta = {
  id: "stopwatch",
  title: "Basic Stopwatch",
  description: "A stopwatch state machine demonstrating timed state transitions",
  category: "Stopwatch",
  tags: ["createMachine", "timers"],
  order: 1,
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
