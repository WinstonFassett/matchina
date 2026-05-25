import type { ExampleMeta } from "./types";
import { createTrafficLightMachine } from "../code/examples/traffic-light/machine";
import { TrafficLightView } from "../code/examples/traffic-light/TrafficLightView";
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
  machineFactory: createTrafficLightMachine,
  AppView: TrafficLightView,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "TrafficLightView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
