import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/hsm-combobox/nested/machine.ts?raw";
import viewRaw from "../code/examples/hsm-combobox/nested/ComboboxView.tsx?raw";
import indexRaw from "../code/examples/hsm-combobox/index.tsx?raw";

const meta: ExampleMeta = {
  id: "hsm-combobox",
  title: "Hierarchical Combobox",
  description: "An autocomplete tag editor demonstrating complex nested state management with keyboard navigation.",
  category: "Hierarchical",
  tags: ["hsm", "hierarchical", "keyboard", "forms"],
  order: 2,
  span: "full",
  getMachine: () => import("../code/examples/hsm-combobox/nested/machine").then((m) => ({ default: m.createComboboxMachine })),
  getAppView: () => import("../code/examples/hsm-combobox/nested/ComboboxView").then((m) => ({ default: m.ComboboxViewNested })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "ComboboxView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
