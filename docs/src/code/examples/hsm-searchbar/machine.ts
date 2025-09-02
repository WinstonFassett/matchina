import { createPromiseMachine, defineStates, effect, matchina, setup, whenEventType, whenState } from "matchina";
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
  if (!query?.length) return undefined;
  console.log('creating fetcher for', query, typeof query);
  const fetcher = createPromiseMachine(async (q: string) => {
    await new Promise((r) => setTimeout(r, 250));
    console.log("Fetching results for", q, typeof q)
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
  // // ah we should not run this yet, should wait until hook call
  // console.log('executing', query)
  // fetcher.execute(query);
  return fetcher;
}

function createActiveMachine({onDone}: {onDone: (ev: any) => void}) {
  const commonTransitions = {
    typed: (value: string) => activeStates.TextEntry(value),
    clear: () => activeStates.Empty(""),
  } as const;

  const active = matchina(activeStates, {
    Empty: commonTransitions,
    TextEntry: {
      ...commonTransitions,
      // Submit allows optional query; fallback to current state's query for backward compatibility
      submit: (query?: string) => (ev) => activeStates.Query(query ?? ev.from.data.query),
    },
    Query: {
      ...commonTransitions,
      // Refine back to TextEntry with explicit query
      // handle: (query?: string) => (ev) => activeStates.TextEntry(query ?? ev.from.data.query) },
      refine: (query: string) => activeStates.TextEntry(query),
      // Child promise machine completed; accept either ev or ev.data shape
      "child.exit": (ev: any) => {
        const payload = ev?.data ?? ev ?? {};
        return activeStates.Selecting({
          query: payload.query ?? "",
          items: payload.items ?? [],
        });
      },
      setError: (query: string, message: string) => activeStates.Error(query, message),
    },
    Selecting: {
      ...commonTransitions,
      // Refine from Selecting to TextEntry; accept optional query
      refine: (query?: string) => (ev) => activeStates.TextEntry(query ?? ev.from.data.query),
      highlight: (index: number) => (ev) =>
        activeStates.Selecting({
          ...ev.from.data,
          highlightedIndex: index,
        }),
      setError: (query: string, message: string) => activeStates.Error(query, message),
      // Complete selection; accept optional query and fallback to current state's query
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

  setup(activeMachine)(
    effect(whenState("Query", (ev: any) => {
      console.log('start query', ev)
      ev.to.data.machine?.execute(ev.to.data.query as string);
      return () => {};
    }))
  );

  hierarchical = createHierarchicalMachine(searchBar);
  
  setup(hierarchical)(effect(whenEventType("done", () => hierarchical.close()) as any));

  return Object.assign(hierarchical, { activeMachine });
}
