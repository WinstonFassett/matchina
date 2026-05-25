import type { ExampleMeta } from "./types";
import { createAuthMachine } from "../code/examples/auth-flow/machine";
import { AuthFlowView } from "../code/examples/auth-flow/AuthFlowView";
import machineRaw from "../code/examples/auth-flow/machine.ts?raw";
import viewRaw from "../code/examples/auth-flow/AuthFlowView.tsx?raw";
import indexRaw from "../code/examples/auth-flow/index.tsx?raw";

const meta: ExampleMeta = {
  id: "auth-flow",
  title: "Authentication Flow",
  description: "Complete authentication flow with login, registration, and password reset",
  category: "Advanced",
  tags: ["createMachine", "multi-state", "forms"],
  order: 1,
  docSlug: "learn/examples/auth-flow",
  machineFactory: createAuthMachine,
  AppView: AuthFlowView,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "AuthFlowView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
