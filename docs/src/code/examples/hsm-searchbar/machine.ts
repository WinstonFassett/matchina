import { createPromiseMachine, defineStates, effect, matchina, setup, whenEventType } from "matchina";
import { createHierarchicalMachine } from "../../../../../src/nesting/propagateSubmachines";

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
    typed: { to: "TextEntry", handle: (value: string) => activeStates.TextEntry(value) },
    clear: { to: "Empty", handle: () => activeStates.Empty("") },
  } as const;

  const active = matchina(activeStates, {
    Empty: commonTransitions,
    TextEntry: {
      ...commonTransitions,
      submit: { to: "Query", handle: () => (ev) => activeStates.Query(ev.from.data.query) },
    },
    Query: {
      ...commonTransitions,
      refine: { to: "TextEntry", handle: () => (ev) => activeStates.TextEntry(ev.from.data.query) },
      "child.exit": { to: "Selecting", handle: ({ data }) => activeStates.Selecting({ 
        query: data.query, 
        items: data.items 
      }) },
      setError: { to: "Error", handle: (query: string, message: string) => activeStates.Error(query, message) },
    },
    Selecting: {
      ...commonTransitions,
      refine: { to: "TextEntry", handle: () => (ev) => activeStates.TextEntry(ev.from.data.query) },
      highlight: { to: "Selecting", handle: (index: number) => (ev) => activeStates.Selecting({
        ...ev.from.data, 
        highlightedIndex: index
      }) },
      setError: { to: "Error", handle: (query: string, message: string) => activeStates.Error(query, message) },
      done: { to: "TextEntry", handle: () => (ev) => activeStates.TextEntry(ev.from.data.query) },
    },
    Error: { 
      retry: { to: "TextEntry", handle: () => (ev) => activeStates.TextEntry(ev.from.data.query || "") }, 
      clear: { to: "Empty", handle: () => activeStates.Empty("") } 
    },
  }, activeStates.Empty(""));

  setup(active)(
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
  let hierarchical: any;
  
  const activeMachine = createActiveMachine({
    onDone: () => hierarchical.close()
  });
  
  searchBar = matchina({
    ...appStates,
    Active: () => appStates.Active(activeMachine),
  }, {
    Inactive: { 
      focus: "Active"
    },
    Active: { 
      blur: "Inactive", 
      close: "Inactive",
    },
  }, appStates.Inactive());

  hierarchical = createHierarchicalMachine(searchBar);
  
  setup(hierarchical)(
    effect(whenEventType("done", () => hierarchical.close()))
  );

  return Object.assign(hierarchical, { activeMachine });
}
