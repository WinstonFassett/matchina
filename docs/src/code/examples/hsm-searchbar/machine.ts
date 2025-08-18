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
  Query: (query: string) => ({ query, machine: createResultsFetcher(query) }),
  Selecting: ({ query="", results=[], highlightedIndex=-1 }: Partial<SelectionState>) => ({ query, results, highlightedIndex }),
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
    return {
      query,
      items: Array.from({ length: n }).map((_, i) => ({ id: `${query}-${i + 1}`, title: `Result ${i + 1} for "${query}"` })),
      final: true
    }
  });
  fetcher.execute(query)
  console.log('fetching!', query)
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
        submit: () => (ev) => activeStates.Query(ev.from.data.query),
      },
      Query: {
        ...commonTransitions,
        refine: () => (ev) => activeStates.TextEntry(ev.from.data.query),
        "child.exit": "Selecting",
        setError: "Error",
      },
      Selecting: {
        ...commonTransitions,
        refine: () => (ev) => activeStates.TextEntry(ev.from.data.query),
        highlight: "Selecting",
        setError: "Error",
        done: "TextEntry",
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
      },
      Active: {
        blur: () => appStates.Inactive(),
        close: () => appStates.Inactive(),
      },
    },
    appStates.Inactive()
  );

  return Object.assign(base, { activeMachine });
}
