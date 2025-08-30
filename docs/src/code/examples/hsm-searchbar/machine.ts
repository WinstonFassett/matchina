import { createPromiseMachine, defineStates, effect, matchina, setup, whenEventType } from "matchina";
import { propagateSubmachines } from "../../../../../src/nesting/propagateSubmachines";

interface SelectionState {
  query: string;
  items: Array<{ id: string; title: string }>;
  highlightedIndex: number;
}

// Hierarchical search: App -> Active -> Query (with promise fetcher)
export const activeStates = defineStates({
  Empty: (query: string = "") => ({ query }),
  TextEntry: (query: string) => ({ query }),
  Query: (query: string) => ({ query, machine: createResultsFetcher(query) }),
  Selecting: ({ query="", items=[], highlightedIndex=-1 }: Partial<SelectionState>) => ({
    query, items, highlightedIndex
  }),
  Error: (query: string, message: string) => ({ query, message }),
});

function createResultsFetcher(query: string) {
  const fetcher = createPromiseMachine(async (q: string) => {
    await new Promise((r) => setTimeout(r, 250));
    const trimmed = (q ?? "").trim();
    if (!trimmed.length) return { query: trimmed, items: [], final: true };
    if (trimmed.toLowerCase() === "err") throw new Error("Search failed (demo)");
    
    const itemCount = Math.max(1, Math.min(5, trimmed.length));
    return {
      query: trimmed,
      items: Array.from({ length: itemCount }, (_, i) => ({
        id: `${trimmed}-${i + 1}`, 
        title: `Result ${i + 1} for "${trimmed}"`
      })),
      final: true
    };
  });
  fetcher.execute(query);
  return fetcher;
}

function createActiveMachine({onDone}: {onDone: (ev: any) => void}) {
  const commonTransitions = {
    typed: (value: string) => activeStates.TextEntry(value),
    clear: "Empty",
  } as const;

  const active = matchina(activeStates, {
    Empty: commonTransitions,
    TextEntry: {
      ...commonTransitions,
      submit: () => (ev) => activeStates.Query(ev.from.data.query),
    },
    Query: {
      ...commonTransitions,
      refine: () => (ev) => activeStates.TextEntry(ev.from.data.query),
      "child.exit": ({ data }) => activeStates.Selecting({ 
        query: data.query, 
        items: data.items 
      }),
      setError: "Error",
    },
    Selecting: {
      ...commonTransitions,
      refine: () => (ev) => activeStates.TextEntry(ev.from.data.query),
      highlight: (index: number) => (ev) => activeStates.Selecting({
        ...ev.from.data, 
        highlightedIndex: index
      }),
      setError: "Error",
      done: "TextEntry",
    },
    Error: { retry: "TextEntry", clear: "Empty" },
  }, activeStates.Empty(""));

  setup(active)(
    propagateSubmachines(active),
    effect(whenEventType("done", onDone))
  );
  return active;
}

export type ActiveMachine = ReturnType<typeof createActiveMachine>;

export const appStates = defineStates({
  Inactive: () => ({}),
  Active: (machine: ActiveMachine) => ({ machine }),
});

export function createSearchBarMachine() {
  let searchBar: any;
  
  const activeMachine = createActiveMachine({
    onDone: () => searchBar.close()
  });
  
  searchBar = matchina(appStates, {
    Inactive: { focus: () => appStates.Active(activeMachine) },
    Active: { blur: "Inactive", close: "Inactive" },
  }, appStates.Inactive());

  return Object.assign(searchBar, { activeMachine });
}
