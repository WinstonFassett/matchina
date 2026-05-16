import type { ExampleMeta } from "./types";
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
  hideVizPicker: true,
  docSlug: "learn/examples/toggle",
  getMachine: () => import("../code/examples/toggle/machine").then((m) => ({ default: m.createToggleMachine })),
  getAppView: () => import("../code/examples/toggle/ToggleView").then((m) => ({ default: m.ToggleView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "ToggleView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
