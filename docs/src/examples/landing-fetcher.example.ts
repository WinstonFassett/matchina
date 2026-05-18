import type { ExampleMeta } from "./types";
import machineRaw from "../code/examples/landing-fetcher/machine.ts?raw";

const meta: ExampleMeta = {
  id: "landing-fetcher",
  title: "Fetcher Machine",
  description: "A simple fetcher state machine",
  category: "Fetcher",
  indexable: false,
  getMachine: () => import("../code/examples/landing-fetcher/machine").then((m) => ({ default: m.createLandingFetcherMachine })),
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
  ],
};

export default meta;
