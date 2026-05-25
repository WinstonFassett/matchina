import type { ExampleMeta } from "./types";
import { createToggleMachine } from "../code/examples/toggle/machine";
import { ToggleView } from "../code/examples/toggle/ToggleView";
import machineRaw from "../code/examples/toggle/machine.ts?raw";
import viewRaw from "../code/examples/toggle/ToggleView.tsx?raw";
import indexRaw from "../code/examples/toggle/index.tsx?raw";

const meta: ExampleMeta = {
  id: "toggle",
  title: "Toggle State Machine",
  description: "A basic on/off toggle state machine example",
  category: "Basic",
  tags: ["createMachine", "addEventApi", "two-states"],
  order: 1,
  featured: true,
  docSlug: "learn/examples/toggle",
  defaultViz: "reactflow",
  machineFactory: createToggleMachine,
  AppView: ToggleView,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "ToggleView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
