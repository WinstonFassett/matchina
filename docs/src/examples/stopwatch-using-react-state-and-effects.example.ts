import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/stopwatch-using-react-state-and-effects/machine.ts?raw";
import viewRaw from "../code/examples/stopwatch-using-react-state-and-effects/StopwatchView.tsx?raw";
import useStopwatchRaw from "../code/examples/stopwatch-using-react-state-and-effects/useStopwatch.ts?raw";
import indexRaw from "../code/examples/stopwatch-using-react-state-and-effects/index.tsx?raw";

const meta: ExampleMeta = {
  id: "stopwatch-using-react-state-and-effects",
  title: "Stopwatch with React State and Effects",
  description: "Stopwatch that drives ticking with useEffect on the machine state",
  category: "Stopwatch",
  tags: ["react-state", "useEffect"],
  order: 4,
  defaultViz: "reactflow",
  getMachine: () =>
    import("../code/examples/stopwatch-using-react-state-and-effects/machine").then((m) => ({
      default: m.createStopwatchMachine,
    })),
  getAppView: () =>
    import("../code/examples/stopwatch-using-react-state-and-effects/index").then((m) => ({
      default: m.Stopwatch,
    })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "useStopwatch.ts", code: useStopwatchRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
