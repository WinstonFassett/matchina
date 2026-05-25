import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/balanced-paren-checker/machine.ts?raw";
import indexRaw from "../code/examples/balanced-paren-checker/index.tsx?raw";

const meta: ExampleMeta = {
  id: "balanced-paren-checker",
  title: "Balanced Parentheses Checker",
  description: "Stack-based machine that validates nested brackets character by character",
  category: "Advanced",
  tags: ["createMachine", "stack", "validation"],
  order: 20,
  defaultViz: "reactflow",
  getMachine: () =>
    import("../code/examples/balanced-paren-checker/machine").then((m) => ({
      default: m.balancedParenthesesChecker,
    })),
  getAppView: () =>
    import("../code/examples/balanced-paren-checker/index").then((m) => ({
      default: m.BalancedParentheses,
    })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
