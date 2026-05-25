import type { ExampleMeta } from "./types";
import { createFlatTrafficLight } from "../code/examples/hsm-traffic-light/machine-flat";
import { TrafficLightViewFlat } from "../code/examples/hsm-traffic-light/TrafficLightViewFlat";
import flatMachineRaw from "../code/examples/hsm-traffic-light/machine-flat.ts?raw";
import flatViewRaw from "../code/examples/hsm-traffic-light/TrafficLightViewFlat.tsx?raw";
import indexRaw from "../code/examples/hsm-traffic-light/index.tsx?raw";

const meta: ExampleMeta = {
  id: "hsm-traffic-light-flat",
  title: "Hierarchical Traffic Light (Flat)",
  description: "Flattened variant of the hierarchical traffic light — same behavior, explicit transitions instead of propagation.",
  category: "Hierarchical",
  tags: ["hsm", "hierarchical", "flattened"],
  order: 1,
  indexable: false,
  machineFactory: createFlatTrafficLight,
  AppView: TrafficLightViewFlat,
  getSourceFiles: async () => [
    { name: "machine-flat.ts", code: flatMachineRaw },
    { name: "TrafficLightViewFlat.tsx", code: flatViewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
