import { createPromiseMachine, defineStates, effect, matchina, setup, whenEventType, whenState } from "matchina";
import { propagateSubmachines } from "../../../../../playground/propagateSubmachines";

interface SelectionState {
  query: string;
  items: Array<{ id: string; title: string }>;
  highlightedIndex: number;
}

// Child machine for Active state: handles text, submit, results (results has a nested promise fetcher)
export const activeStates = defineStates({
  Empty: (query: string = "") => ({ query }),
  TextEntry: (query: string) => ({ query }),
  Query: (query: string) => ({ query, machine: createResultsFetcher(query) }),
  Selecting: ({ query="", items=[], highlightedIndex=-1 }: Partial<SelectionState>) => {
    console.log('selecting', query, items, highlightedIndex)
    return ({ query, items, highlightedIndex })
  },
  Error: (query: string, message: string) => ({ query, message }),
});

// Grandchild: promise fetcher (Idle/Pending/Resolved/Rejected)
function createResultsFetcher(query: string) {
  const fetcher = createPromiseMachine(async (q: string) => {
    // simple delayed autocomplete: 'err' -> reject, else N items
    await new Promise((r) => setTimeout(r, 250));
    const query = (q ?? "").trim();
    if (!query.length) return {
      query,
      items: [] as Array<{ id: string; title: string }>,
      final: true
    };
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

function createActiveMachine({onDone}: {onDone: (ev: any) => void}) {
  const commonTransitions = {
    typed: (value: string) => activeStates.TextEntry(value),
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
        "child.exit": ({ data, id, state }) => (ev) => {
          console.log('child.exit', {data, id, state, ev})
          const { query, items } = data
          return activeStates.Selecting({ query, items })
        },
        setError: "Error",
      },
      Selecting: {
        ...commonTransitions,
        refine: () => (ev) => activeStates.TextEntry(ev.from.data.query),
        // highlight: "Selecting",
        highlight: (index: number) => (ev) => activeStates.Selecting({ ...ev.from.data, highlightedIndex: index }),
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

  setup(machine)(
    propagateSubmachines(machine),
    effect(whenState("TextEntry", (ev) => {
      console.log('entering TextEntry', ev.to.data)
    })),
    effect(whenEventType("done", onDone))
  );
  return machine
}

export type ActiveMachine = ReturnType<typeof createActiveMachine>;

export const appStates = defineStates({
  Inactive: () => ({}),
  Active: (machine: ActiveMachine) => ({ machine }),
});

export function createSearchBarMachine() {
  const activeMachine = createActiveMachine({onDone: (ev) => {
    console.log('done', ev)
    base.close()
  }});
  const base = matchina(
    appStates,
    {
      Inactive: {
        focus: () => appStates.Active(activeMachine),
      },
      Active: {
        blur: "Inactive",
        close: "Inactive",
      },
    },
    appStates.Inactive()
  );

  return Object.assign(base, { activeMachine });
}
