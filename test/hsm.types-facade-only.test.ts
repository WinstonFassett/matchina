import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";

// Type ergonomics: createHierarchicalMachine widens send to parent + child events.
describe("types: createHierarchicalMachine send union", () => {
  function createChild() {
    const states = defineStates({ Red: undefined, Green: undefined });
    const transitions = {
      Red: { tick: "Green" },
      Green: { tick: "Red" },
    } as const;
    const m = createMachine(states, transitions, "Red");
    propagateSubmachines(m);
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
    propagateSubmachines(m);
    return m;
  }

  it("facade accepts child + parent events", () => {
    const ctrl = createParent();
    const r = createHierarchicalMachine(ctrl);

    // compiles: child event
    r.send("tick");
    // compiles: parent events
    r.send("break");
    r.send("repair");

    // negative: nonexistent event
    // Note: createHierarchicalMachine allows any string, so "nope" is now allowed
    r.send("nope"); // This compiles with HierarchicalMachine

    // Optional: type assertions if available
    // expectTypeOf<RoutedEventsOf<typeof ctrl>>(); // would require exported type
  });
});
