import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../playground/propagateSubmachines";
import { routedFacade } from "../playground/routedFacade";

// Scenario: child is duck-typed with dispatch only.
// Also: bogus machine payload should be ignored gracefully (no crash), and parent can handle.
describe("HSM routing: duck-typed child and bogus payload", () => {
  function createParentWithDispatchChild() {
    let dispatched: { type?: string; args: any[] } | null = null;

    // minimal duck child with getState + dispatch (no send)
    const duckChild = {
      getState() {
        return { key: "X" } as any;
      },
      dispatch(type: string, ...args: any[]) {
        dispatched = { type, args };
      },
    };

    const states = defineStates({
      Idle: undefined,
      Working: () => ({ data: { machine: duckChild } }),
    });

    const transitions = {
      Idle: { go: "Working" },
      Working: {
        // Parent doesn't know 'poke', so it should route to child (dispatch)
        stop: "Idle",
      },
    } as const;

    const m = createMachine(states, transitions, "Idle");
    setup(m)(propagateSubmachines(m));
    return { m, get dispatched() { return dispatched; } };
  }

  it("routes to dispatch when child exposes dispatch only", () => {
    const { m, dispatched } = createParentWithDispatchChild();
    m.send("go");
    expect(m.getState().key).toBe("Working");

    const before = m.getState();
    // should route to child.dispatch via typed parent facade
    const r = routedFacade(m);
    (r as any).send("poke", 1, 2, 3);
    const after = m.getState();

    expect(before).toBe(after); // parent unchanged
    expect(dispatched).toEqual({ type: "poke", args: [1, 2, 3] });
  });

  function createParentWithBogusChild() {
    const bogus = { foo: 1 } as any; // no getState/send/dispatch

    const states = defineStates({
      Idle: undefined,
      Working: () => ({ data: { machine: bogus } }),
    });

    const transitions = {
      Idle: { go: "Working" },
      Working: {
        // Parent handles 'nudge' via self-transition
        nudge: "Working",
      },
    } as const;

    const m = createMachine(states, transitions, "Idle");
    setup(m)(propagateSubmachines(m));
    return { m };
  }

  it("ignores bogus machine payload; parent handles safely", () => {
    const { m } = createParentWithBogusChild();
    m.send("go");
    expect(m.getState().key).toBe("Working");

    const before = m.getState();
    // child is bogus; should not crash and parent should handle
    m.send("nudge");
    const after = m.getState();

    expect(after.key).toBe("Working");
    expect(before).toBe(after);
  });
});
