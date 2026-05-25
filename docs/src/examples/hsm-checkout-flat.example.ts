import type { ExampleMeta } from "./types";
import { createFlatCheckoutMachine } from "../code/examples/hsm-checkout/machine-flat";
import { CheckoutViewFlat } from "../code/examples/hsm-checkout/CheckoutViewFlat";
import flatMachineRaw from "../code/examples/hsm-checkout/machine-flat.ts?raw";
import flatViewRaw from "../code/examples/hsm-checkout/CheckoutViewFlat.tsx?raw";
import indexRaw from "../code/examples/hsm-checkout/index.tsx?raw";

const meta: ExampleMeta = {
  id: "hsm-checkout-flat",
  title: "Hierarchical Checkout (Flat)",
  description: "Flattened variant of the hierarchical checkout — same flow, no submachine nesting.",
  category: "Hierarchical",
  tags: ["hsm", "hierarchical", "flattened", "multi-step"],
  order: 3,
  indexable: false,
  machineFactory: createFlatCheckoutMachine,
  AppView: CheckoutViewFlat,
  getSourceFiles: async () => [
    { name: "machine-flat.ts", code: flatMachineRaw },
    { name: "CheckoutViewFlat.tsx", code: flatViewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
