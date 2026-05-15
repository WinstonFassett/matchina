import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useEffect/machine.ts?raw";
import viewRaw from "../code/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useEffect/StopwatchView.tsx?raw";
import useStopwatchRaw from "../code/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useEffect/useStopwatch.ts?raw";
import indexRaw from "../code/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useEffect/index.tsx?raw";

const meta: ExampleMeta = {
  id: "stopwatch-using-react-state-using-lifecycle-instead-of-useeffect",
  title: "Stopwatch with Lifecycle",
  description: "Stopwatch using lifecycle hooks instead of useEffect",
  category: "Stopwatch",
  tags: ["lifecycle", "react-state"],
  order: 7,
  getMachine: () => import("../code/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useEffect/machine").then((m) => ({ default: m.createStopwatch })),
  getAppView: () => import("../code/examples/stopwatch-using-react-state-using-lifecycle-instead-of-useEffect/StopwatchView").then((m) => ({ default: m.StopwatchView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "useStopwatch.ts", code: useStopwatchRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
