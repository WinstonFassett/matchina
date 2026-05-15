import type { ExampleMeta } from "./types";
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
  getMachine: () => import("../code/examples/stopwatch/machine").then((m) => ({ default: m.createStopwatchMachine })),
  getAppView: () => import("../code/examples/stopwatch/StopwatchView").then((m) => ({ default: m.StopwatchView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
