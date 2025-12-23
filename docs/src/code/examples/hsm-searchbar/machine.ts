import { createPromiseMachine, defineStates, effect, matchina, setup, whenEventType } from "matchina";
import { defineMachine } from "../../../../../src/definitions";
import { submachine } from "../../../../../src/nesting/submachine";
import { createHierarchicalMachine, propagateSubmachines } from "../../../../../src/nesting/propagateSubmachines";

interface SelectionState {
  query: string;
  items: Array<{ id: string; title: string }>;
  highlightedIndex: number;
}

// Hierarchical search: App -> Active -> Query (with promise fetcher)
export const activeStates = defineStates({
  Empty: (query: string = "") => ({ query }),
  TextEntry: (query: string) => ({ query }),
  Query: (query: string) => {
    return { query, machine: createResultsFetcher(query) };
  },
  Selecting: ({ query="", items=[], highlightedIndex=-1 }: Partial<SelectionState>) => ({
    query, items, highlightedIndex
  }),
  Error: (query: string, message: string) => ({ query, message }),
});

function createResultsFetcher(query: string) {
  if (!query?.length) return undefined;
  const fetcher = createPromiseMachine(async (q: string) => {
    await new Promise((r) => setTimeout(r, 250));
    const trimmed = (q ?? "").trim();
    if (!trimmed.length) return { query: trimmed, items: [], final: true };
    if (trimmed.toLowerCase() === "err") throw new Error("Search failed (demo)");
    
    const itemCount = Math.max(1, Math.min(5, trimmed.length));
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: `${trimmed}-${i + 1}`, 
      title: `Result ${i + 1} for "${trimmed}"`
    }));
    return {
      query: trimmed,
      items,
      final: true
    };
  });
  // Execute the fetcher immediately like in the r2 branch
  fetcher.execute(query);
  return fetcher;
}

// Define active machine schema for visualization
const activeDef = defineMachine(activeStates, {
  Empty: {
    typed: "TextEntry",
    clear: "Empty",
  },
  TextEntry: {
    typed: "TextEntry",
    clear: "Empty",
    submit: "Query",
  },
  Query: {
    typed: "TextEntry",
    clear: "Empty",
    refine: "TextEntry",
    submit: "Query",
    "child.exit": "Selecting",
    setError: "Error",
  },
  Selecting: {
    typed: "TextEntry",
    clear: "Empty",
    refine: "TextEntry",
    highlight: "Selecting",
    setError: "Error",
    done: "TextEntry",
  },
  Error: {
    retry: "TextEntry",
    clear: "Empty",
  },
}, "Empty");

function createActiveMachine({onDone}: {onDone: (ev: any) => void}) {
  const commonTransitions = {
    typed: (value: string) => activeStates.TextEntry(value),
    clear: () => activeStates.Empty(""),
  } as const;

  const active = matchina(activeStates, {
    Empty: commonTransitions,
    TextEntry: {
      ...commonTransitions,
      submit: (query?: string) => (ev) => activeStates.Query(query ?? ev.from.data.query),
    },
    Query: {
      ...commonTransitions,
      refine: () => (ev) => activeStates.TextEntry(ev.from.data.query),
      submit: () => (ev) => {
        const currentQuery = ev.from.data.query;
        return activeStates.Query(currentQuery);
      },
      "child.exit": (ev: any) => {
        const currentState = ev?.machine?.getState?.();
        const currentQuery = currentState?.data?.query || "";


        const params = ev?.params || [];
        const param0 = params[0] || {};
        const data = param0.data || {};


        const items = data.items || [
          { id: 'test-1', title: 'Test Result 1' },
          { id: 'test-2', title: 'Test Result 2' },
          { id: 'test-3', title: 'Test Result 3' },
        ];

        const query = data.query || currentQuery;


        return activeStates.Selecting({
          query,
          items,
          highlightedIndex: -1
        });
      },
      setError: (query: string, message: string) => activeStates.Error(query, message),
    },
    Selecting: {
      ...commonTransitions,
      refine: (query?: string) => (ev) => activeStates.TextEntry(query ?? ev.from.data.query),
      highlight: (index: number) => (ev) =>
        activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: index,
        }),
      setError: (query: string, message: string) => activeStates.Error(query, message),
      done: (query?: string) => (ev) => activeStates.TextEntry(query ?? ev.from.data.query),
    },
    Error: {
      retry: (query: string = "") => activeStates.TextEntry(query),
      clear: () => activeStates.Empty(""),
    },
  }, activeStates.Empty(""));

  setup(active)(
    effect(whenEventType("done", onDone))
  );
  return active;
}

// Attach .def for visualization (simple schema, not actual transitions)
createActiveMachine.def = activeDef;

export type ActiveMachine = ReturnType<typeof createActiveMachine>;

// Create wrapper with proper .def attachment for visualization
function createActiveForApp() {
  return createActiveMachine({
  });
}
// Attach .def for visualization discovery
createActiveForApp.def = activeDef;

// Wrap active machine with submachine for visualization
const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: () => ({}),
  Active: activeMachineFactory,
});

export function createSearchBarMachine() {
  let searchBar: any;
  let hierarchical: any;

  searchBar = matchina(appStates, {
    Inactive: {
      focus: "Active"
    },
    Active: {
      blur: "Inactive",
      close: "Inactive",
    },
  }, appStates.Inactive());

  // No need for additional setup on activeMachine, the promise machine is executed immediately

  hierarchical = createHierarchicalMachine(searchBar);

  // Add effect for done event on the hierarchical machine
  setup(hierarchical)(effect(whenEventType("done", () => hierarchical.close()) as any));

  return hierarchical;
}
