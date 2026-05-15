import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/traffic-light-extended/machine.ts?raw";
import statesRaw from "../code/examples/traffic-light-extended/states.ts?raw";
import hooksRaw from "../code/examples/traffic-light-extended/hooks.ts?raw";
import viewRaw from "../code/examples/traffic-light-extended/TrafficLightView.tsx?raw";
import indexRaw from "../code/examples/traffic-light-extended/index.tsx?raw";

const meta: ExampleMeta = {
  id: "traffic-light-extended",
  title: "Extended Traffic Light",
  description: "A traffic light with pedestrian crossing controls",
  category: "Advanced",
  tags: ["createMachine", "timers", "extended-state"],
  order: 3,
  getMachine: () => import("../code/examples/traffic-light-extended/machine").then((m) => ({ default: m.createExtendedTrafficLightMachine })),
  getAppView: () => import("../code/examples/traffic-light-extended/TrafficLightView").then((m) => ({ default: m.ExtendedTrafficLightView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "states.ts", code: statesRaw },
    { name: "hooks.ts", code: hooksRaw },
    { name: "TrafficLightView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
