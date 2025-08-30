import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { routedFacade } from "../src/nesting/routedFacade";

// Facade-only type ergonomics: routedFacade widens send to parent + child events.
describe("types: routedFacade send union", () => {
  function createChild() {
    const states = defineStates({ Red: undefined, Green: undefined });
    const transitions = {
      Red: { tick: "Green" },
      Green: { tick: "Red" },
    } as const;
    const m = createMachine(states, transitions, "Red");
    setup(m)(propagateSubmachines(m));
    return m;
  }

  function createParent() {
    const states = defineStates({
      Working: () => ({ machine: createChild() }),
      Broken: undefined,
    });
    const transitions = {
      Working: { break: "Broken" },
      Broken: { repair: "Working" },
    } as const;
    const m = createMachine(states, transitions, "Working");
    setup(m)(propagateSubmachines(m));
    return m;
  }

  it("facade accepts child + parent events", () => {
    const ctrl = createParent();
    const r = routedFacade(ctrl);

    // compiles: child event
    r.send("tick");
    // compiles: parent events
    r.send("break");
    r.send("repair");

    // negative: nonexistent event
    // @ts-expect-error
    r.send("nope");

    // Optional: type assertions if available
    // expectTypeOf<RoutedEventsOf<typeof ctrl>>(); // would require exported type
  });
});
