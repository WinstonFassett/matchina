import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/traffic-light/machine.ts?raw";
import viewRaw from "../code/examples/traffic-light/TrafficLightView.tsx?raw";
import indexRaw from "../code/examples/traffic-light/index.tsx?raw";

const meta: ExampleMeta = {
  id: "traffic-light",
  title: "Traffic Light State Machine",
  description: "A simple traffic light with distinct states",
  category: "Basic",
  tags: ["createMachine", "multi-state"],
  order: 3,
  defaultViz: "reactflow",
  getMachine: () => import("../code/examples/traffic-light/machine").then((m) => ({ default: m.createTrafficLightMachine })),
  getAppView: () => import("../code/examples/traffic-light/TrafficLightView").then((m) => ({ default: m.TrafficLightView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "TrafficLightView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
