import type { ExampleMeta } from "./types";
import { createAsyncCalculatorMachine } from "../code/examples/async-calculator/machine";
import { AsyncCalculatorView } from "../code/examples/async-calculator/AsyncCalculatorView";
import machineRaw from "../code/examples/async-calculator/machine.ts?raw";
import hooksRaw from "../code/examples/async-calculator/hooks.ts?raw";
import viewRaw from "../code/examples/async-calculator/AsyncCalculatorView.tsx?raw";
import indexRaw from "../code/examples/async-calculator/index.tsx?raw";

const meta: ExampleMeta = {
  id: "async-calculator",
  title: "Async Calculator",
  description: "An async calculator demonstrating promise machine patterns",
  category: "Async",
  tags: ["promise-machine", "async"],
  order: 1,
  machineFactory: createAsyncCalculatorMachine,
  AppView: AsyncCalculatorView,
  getSourceFiles: async () => [
    { name: "machine.ts", code: machineRaw },
    { name: "hooks.ts", code: hooksRaw },
    { name: "AsyncCalculatorView.tsx", code: viewRaw },
    { name: "index.tsx", code: indexRaw },
  ],
};

export default meta;
