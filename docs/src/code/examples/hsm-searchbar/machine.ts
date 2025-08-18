import { addEventApi, createMachine, defineStates, createPromiseMachine, setup, enter, whenState, matchina } from "matchina";
import { withSubstates } from "../../../../../playground/withSubstates";

interface SelectionState {
  query: string;
  results: Array<{ id: string; title: string }>;
  highlightedIndex: number;
}

// Child machine for Active state: handles text, submit, results (results has a nested promise fetcher)
export const activeStates = defineStates({
  Empty: (query: string = "") => ({ query }),
  TextEntry: (query: string) => ({ query }),
  // Compose the nested fetcher with withSubstates while preserving the query on the Results state
  // Results: (query: string) => ({ query, ...withSubstates(createResultsFetcher)() }),
  Results: (query: string) => ({ query, machine: createResultsFetcher(query) }),
  // Add Error state so transitions can target it without using `as any`
  Error: (query: string, message: string) => ({ query, message }),
});

// Grandchild: promise fetcher (Idle/Pending/Resolved/Rejected)
function createResultsFetcher(query: string) {
  const fetcher = createPromiseMachine(async (q: string) => {
    // simple delayed autocomplete: 'err' -> reject, else N items
    await new Promise((r) => setTimeout(r, 250));
    const query = (q ?? "").trim();
    if (!query.length) return [] as Array<{ id: string; title: string }>;
    if (query.toLowerCase() === "err") throw new Error("Search failed (demo)");
    const n = Math.max(1, Math.min(5, query.length));
    return Array.from({ length: n }).map((_, i) => ({ id: `${query}-${i + 1}`, title: `Result ${i + 1} for "${query}"` }));
  });
  fetcher.execute(query)
  return fetcher;
}

function createActiveMachine() {

  const commonTransitions = {
    typed: "TextEntry",
    clear: "Empty",
  } as const;

  const machine = matchina(
    activeStates,
    {
      Empty: {
        ...commonTransitions,
      },
      TextEntry: {
        ...commonTransitions,
        submit: () => (ev) => activeStates.Results(ev.from.data.query),
      },
      Results: {
        ...commonTransitions,
        refine: () => (ev) => activeStates.TextEntry(ev.from.data.query),
        setResults: "Results",
        setError: "Error",
      },
      Error: {
        retry: "TextEntry",
        clear: "Empty",
      },
    },
    activeStates.Empty("")
  );


  // On entering TextEntry, automatically start fetch for current query (acts like debounce handled by promise delay)
  setup(machine)(
    enter(
      whenState("TextEntry", (ev) => {
        console.log('entering TextEntry', ev.to.data)
      })
    )
  );
  // return Object.assign(machine, { fetcher });
  return machine
}

export type ActiveMachine = ReturnType<typeof createActiveMachine>;

// Parent machine: Inactive <-> Active(with child)
export const appStates = defineStates({
  Inactive: () => ({}),
  Active: (machine: ActiveMachine) => ({ machine }),
});

export function createSearchBarMachine() {
  const activeMachine = createActiveMachine();
  const base = matchina(
    appStates,
    {
      Inactive: {
        focus: () => appStates.Active(activeMachine),
        // typed: (_text: string) => appStates.Active(activeMachine),
      },
      Active: {
        blur: () => appStates.Inactive(),
        close: () => appStates.Inactive(),
        // child-first routing for: typed, clear, submit
      },
    },
    appStates.Inactive()
  );

  return Object.assign(base, { activeMachine });
}
