import type { ExampleMeta } from "./types";
import { createStopwatchMachine } from "../code/examples/stopwatch-using-react-state-and-state-effects/machine";
import { Stopwatch } from "../code/examples/stopwatch-using-react-state-and-state-effects/index";
import machineRaw from "../code/examples/stopwatch-using-react-state-and-state-effects/machine.ts?raw";
import viewRaw from "../code/examples/stopwatch-using-react-state-and-state-effects/StopwatchView.tsx?raw";
import useStopwatchRaw from "../code/examples/stopwatch-using-react-state-and-state-effects/useStopwatch.ts?raw";
import indexRaw from "../code/examples/stopwatch-using-react-state-and-state-effects/index.tsx?raw";

const meta: ExampleMeta = {
  id: "stopwatch-using-react-state-and-state-effects",
  title: "Stopwatch with State Effects",
  description: "Stopwatch using per-state effect arrays for clean lifecycle management",
  category: "Stopwatch",
  tags: ["react-state", "state-effects"],
  order: 5,
  defaultViz: "reactflow",
  machineFactory: createStopwatchMachine,
  AppView: Stopwatch,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "useStopwatch.ts", code: useStopwatchRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
