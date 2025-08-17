import { addEventApi, createMachine, defineStates, createPromiseMachine, setup, enter, whenState, type FactoryMachineEvent, type FactoryMachine } from "matchina";
import { withSubstates } from "../../../../../playground/withSubstates";

// Child machine for Active state: handles text, submit, results, error
const activeStates = defineStates({
  Empty: (query: string = "") => ({ query }),
  TextEntry: (query: string) => ({ query }),
  Results: (query: string, results: Array<{ id: string; title: string }>) => ({ query, results }),
  Error: (query: string, message: string) => ({ query, message }),
});

function createActiveMachine() {
  // Promise-based autocomplete fetcher: resolves with demo items after 250ms; 'err' rejects.
  // const fetcher = createPromiseMachine(async (q: string) => {
  //   await new Promise((r) => setTimeout(r, 250));
  //   const query = (q ?? "").trim();
  //   if (!query.length) return [] as Array<{ id: string; title: string }>;
  //   if (query.toLowerCase() === "err") throw new Error("Search failed (demo)");
  //   const n = Math.max(1, Math.min(5, query.length));
  //   return Array.from({ length: n }).map((_, i) => ({ id: `${query}-${i + 1}`, title: `Result ${i + 1} for "${query}"` }));
  // });

  const commonTransitions = {
    typed: "TextEntry",
    clear: "Empty",
  } as const;

  const base = createMachine(
    activeStates,
    {
      Empty: {
        ...commonTransitions,
      },
      TextEntry: {
        ...commonTransitions,
        submit: () => (ev) => {
          // ev.from.data.fetcher?.send?.("start", ev.from.data.query);
          console.log('submit', ev.from.data)
          return activeStates.TextEntry(ev.from.data.query);
        },
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

  const machine = addEventApi(base);
  
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

// Parent machine: Inactive <-> Active(with child)
export const appStates = defineStates({
  Inactive: () => ({}),
  Active: (machine: FactoryMachine<any>) => ({ machine }),
});

export function createSearchBarMachine() {
  const activeMachine = createActiveMachine();
  const base = createMachine(
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

  return addEventApi(base);
}
