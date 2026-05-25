import type { ExampleMeta } from "./types";
import { createFlatComboboxMachine } from "../code/examples/hsm-combobox/flattened/machine";
import { ComboboxViewFlat } from "../code/examples/hsm-combobox/flattened/ComboboxView";
import flatMachineRaw from "../code/examples/hsm-combobox/flattened/machine.ts?raw";
import flatViewRaw from "../code/examples/hsm-combobox/flattened/ComboboxView.tsx?raw";
import indexRaw from "../code/examples/hsm-combobox/index.tsx?raw";

const meta: ExampleMeta = {
  id: "hsm-combobox-flat",
  title: "Hierarchical Combobox (Flat)",
  description: "Flattened variant of the hierarchical combobox — same behavior, all states at the top level.",
  category: "Hierarchical",
  tags: ["hsm", "hierarchical", "flattened", "keyboard", "forms"],
  order: 2,
  indexable: false,
  span: "full",
  machineFactory: createFlatComboboxMachine,
  AppView: ComboboxViewFlat,
  getSourceFiles: async () => [
    { name: "machine.ts", code: flatMachineRaw },
    { name: "ComboboxView.tsx", code: flatViewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
