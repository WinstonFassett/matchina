# New Copilot Session Prompt for Implementing Code Tabs

I'm working on improving the documentation examples for my TypeScript state machine library called Matchina. I've fixed an issue with the MachineExampleWithChart.tsx component that was causing "machine.getChange is not a function" errors, but now I need to update the stopwatch examples to use code tabs like my other examples.

The **traffic-light-extended** example is working correctly and has proper code tabs. Please use this as a reference model.

I want you to help me:

1. Update all stopwatch examples to use code tabs, following the pattern used in the traffic-light-extended example
2. Each example should have separate files (machine.ts, hooks.ts if applicable, index.tsx, etc.) displayed in tabs
3. Ensure the MDX files properly import and display these code files using the CodeTabs component

The stopwatch examples that need updating are:

- stopwatch-using-data-and-transition-functions
- stopwatch-using-data-and-hooks
- stopwatch-using-react-state-and-effects
- stopwatch-using-external-react-state-and-state-effects
- stopwatch-using-react-state-using-lifecycle-instead-of-useEffect

The traffic-light-extended example uses the following pattern in its MDX file:

```markdown
import ExtendedTrafficLightExample from "@code/examples/traffic-light-extended/example";
import machineCode from "@code/examples/traffic-light-extended/machine.ts?raw";
import viewCode from "@code/examples/traffic-light-extended/TrafficLightView.tsx?raw";
import indexCode from "@code/examples/traffic-light-extended/index.tsx?raw";
import CodeBlock from "@components/CodeBlock.astro";
import CodeTabs from "@components/CodeTabs.astro";

...

<CodeTabs files={[
{ name: "machine.ts", code: machineCode, twoslash: true },
{ name: "TrafficLightView.tsx", code: viewCode },
{ name: "index.tsx", code: indexCode }
]} />
```

Please analyze each stopwatch example and help me implement the code tabs properly.
