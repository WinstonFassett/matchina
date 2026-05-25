import type { ExampleMeta } from "./types";
import { createCheckoutMachine } from "../code/examples/checkout/machine";
import { CheckoutView } from "../code/examples/checkout/CheckoutView";
import machineRaw from "../code/examples/checkout/machine.ts?raw";
import statesRaw from "../code/examples/checkout/states.ts?raw";
import typesRaw from "../code/examples/checkout/types.ts?raw";
import formsRaw from "../code/examples/checkout/forms.tsx?raw";
import viewRaw from "../code/examples/checkout/CheckoutView.tsx?raw";
import indexRaw from "../code/examples/checkout/index.tsx?raw";

const meta: ExampleMeta = {
  id: "checkout",
  title: "Checkout Flow",
  description: "Multi-step checkout process with cart, shipping, and payment",
  category: "Advanced",
  tags: ["createMachine", "multi-step", "forms"],
  order: 2,
  docSlug: "learn/examples/checkout",
  machineFactory: createCheckoutMachine,
  AppView: CheckoutView,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "states.ts", code: statesRaw },
    { name: "types.ts", code: typesRaw },
    { name: "forms.tsx", code: formsRaw },
    { name: "CheckoutView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
