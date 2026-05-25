import type { ExampleMeta } from "./types";
import { createCheckoutMachine } from "../code/examples/hsm-checkout/machine";
import { CheckoutViewNested } from "../code/examples/hsm-checkout/CheckoutViewNested";
import machineRaw from "../code/examples/hsm-checkout/machine.ts?raw";
import flatMachineRaw from "../code/examples/hsm-checkout/machine-flat.ts?raw";
import nestedViewRaw from "../code/examples/hsm-checkout/CheckoutViewNested.tsx?raw";
import flatViewRaw from "../code/examples/hsm-checkout/CheckoutViewFlat.tsx?raw";
import indexRaw from "../code/examples/hsm-checkout/index.tsx?raw";

const meta: ExampleMeta = {
  id: "hsm-checkout",
  title: "Hierarchical Checkout",
  description: "A complex checkout flow with nested payment submachine demonstrating hierarchical state management.",
  category: "Hierarchical",
  tags: ["hsm", "hierarchical", "multi-step", "submachine"],
  order: 3,
  docSlug: "learn/examples/hsm-checkout",
  machineFactory: createCheckoutMachine,
  AppView: CheckoutViewNested,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "machine-flat.ts", code: flatMachineRaw },
    { name: "CheckoutViewNested.tsx", code: nestedViewRaw },
    { name: "CheckoutViewFlat.tsx", code: flatViewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
