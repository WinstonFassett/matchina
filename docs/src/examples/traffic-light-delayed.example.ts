import type { ExampleMeta } from "./types";
import { createTrafficLight } from "../code/examples/traffic-light-delayed/machine";
import { TrafficLight } from "../code/examples/traffic-light-delayed/index";
import machineRaw from "../code/examples/traffic-light-delayed/machine.ts?raw";
import indexRaw from "../code/examples/traffic-light-delayed/index.tsx?raw";

const meta: ExampleMeta = {
  id: "traffic-light-delayed",
  title: "Traffic Light (Delayed)",
  description: "Traffic light with auto-advancing delayed transitions",
  category: "Basic",
  tags: ["createMachine", "delays", "effects"],
  order: 6,
  defaultViz: "reactflow",
  machineFactory: createTrafficLight,
  AppView: TrafficLight,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
