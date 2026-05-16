import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/stopwatch-using-react-state-using-transitionhooks/machine.ts?raw";
import viewRaw from "../code/examples/stopwatch-using-react-state-using-transitionhooks/StopwatchView.tsx?raw";
import useStopwatchRaw from "../code/examples/stopwatch-using-react-state-using-transitionhooks/useStopwatch.ts?raw";
import indexRaw from "../code/examples/stopwatch-using-react-state-using-transitionhooks/index.tsx?raw";

const meta: ExampleMeta = {
  id: "stopwatch-using-transition-hooks-instead-of-useeffect",
  title: "Stopwatch with Transition Hooks",
  description: "Stopwatch using transition hooks instead of useEffect",
  category: "Stopwatch",
  tags: ["transition-hooks", "react-state"],
  order: 8,
  defaultViz: "reactflow",
  getMachine: () => import("../code/examples/stopwatch-using-react-state-using-transitionhooks/machine").then((m) => ({ default: m.createStopwatch })),
  getAppView: () => import("../code/examples/stopwatch-using-react-state-using-transitionhooks/StopwatchView").then((m) => ({ default: m.StopwatchView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "useStopwatch.ts", code: useStopwatchRaw },
    { name: "StopwatchView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
