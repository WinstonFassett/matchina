import type { ExampleMeta } from "./types";
import flatMachineRaw from "../code/examples/hsm-traffic-light/machine-flat.ts?raw";
import propMachineRaw from "../code/examples/hsm-traffic-light/machine.ts?raw";
import flatViewRaw from "../code/examples/hsm-traffic-light/TrafficLightViewFlat.tsx?raw";
import nestedViewRaw from "../code/examples/hsm-traffic-light/TrafficLightViewNested.tsx?raw";
import indexRaw from "../code/examples/hsm-traffic-light/index.tsx?raw";

const meta: ExampleMeta = {
  id: "hsm-traffic-light",
  title: "Hierarchical Traffic Light",
  description: "Comparison of flattened vs propagating hierarchical state machines",
  category: "Hierarchical",
  tags: ["hsm", "hierarchical", "nested-states"],
  order: 1,
  docSlug: "learn/examples/hsm-traffic-light",
  getMachine: () => import("../code/examples/hsm-traffic-light/machine").then((m) => ({ default: m.createPropagatingTrafficLight })),
  getAppView: () => import("../code/examples/hsm-traffic-light/TrafficLightViewNested").then((m) => ({ default: m.TrafficLightViewNested })),
  getSourceFiles: async () => [
    { name: "machine.ts (propagating)", code: propMachineRaw },
    { name: "machine-flat.ts", code: flatMachineRaw },
    { name: "TrafficLightViewNested.tsx", code: nestedViewRaw },
    { name: "TrafficLightViewFlat.tsx", code: flatViewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
