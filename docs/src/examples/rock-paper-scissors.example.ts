import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/rock-paper-scissors/machine.ts?raw";
import statesRaw from "../code/examples/rock-paper-scissors/states.ts?raw";
import storeRaw from "../code/examples/rock-paper-scissors/store.ts?raw";
import viewRaw from "../code/examples/rock-paper-scissors/RPSAppView.tsx?raw";
import indexRaw from "../code/examples/rock-paper-scissors/index.tsx?raw";

const meta: ExampleMeta = {
  id: "rock-paper-scissors",
  title: "Rock-Paper-Scissors Game",
  description: "A game state machine demonstrating state transitions with conditional logic",
  category: "Basic",
  tags: ["createMachine", "game", "store"],
  order: 4,
  docSlug: "learn/examples/rock-paper-scissors",
  getMachine: () => import("../code/examples/rock-paper-scissors/machine").then((m) => ({ default: m.createRPSMachine })),
  getAppView: () => import("../code/examples/rock-paper-scissors/RPSAppView").then((m) => ({ default: m.RPSAppView })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "states.ts", code: statesRaw },
    { name: "store.ts", code: storeRaw },
    { name: "RPSAppView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
