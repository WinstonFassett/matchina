import type { ExampleMeta } from "./types";
import { createStopwatchMachine } from "../code/examples/stopwatch-using-external-react-state-and-state-effects/machine";
import { Stopwatch } from "../code/examples/stopwatch-using-external-react-state-and-state-effects/index";
import machineRaw from "../code/examples/stopwatch-using-external-react-state-and-state-effects/machine.ts?raw";
import viewRaw from "../code/examples/stopwatch-using-external-react-state-and-state-effects/StopwatchView.tsx?raw";
import useStopwatchRaw from "../code/examples/stopwatch-using-external-react-state-and-state-effects/useStopwatch.ts?raw";
import indexRaw from "../code/examples/stopwatch-using-external-react-state-and-state-effects/index.tsx?raw";

const meta: ExampleMeta = {
  id: "stopwatch-using-external-react-state-and-state-effects",
  title: "Stopwatch with External React State",
  description: "Stopwatch with external React state and state effects",
  category: "Stopwatch",
  tags: ["state-effects", "react-state"],
  order: 6,
  defaultViz: "reactflow",
  machineFactory: () => createStopwatchMachine(0, () => {}),
  AppView: Stopwatch,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "useStopwatch.ts", code: useStopwatchRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
