import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { routedFacade } from "../src/nesting/routedFacade";

// 1) resolveExit parity (child-first)
// 2) lifecycle identity swap (break/repair creates new child)
// 3) deep nesting (grandchild > child > parent routing)

describe("HSM resolve-exit, lifecycle, deep nesting", () => {
  function createLight() {
    const states = defineStates({ Red: undefined, Green: undefined });
    const transitions = {
      Red: { tick: "Green" },
      Green: { tick: "Red" },
    } as const;
    const m = createMachine(states, transitions, "Red");
    setup(m)(propagateSubmachines(m));
    return m;
  }

  function createController() {
    const states = defineStates({
      Working: () => ({ machine: createLight() }),
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

  it("resolveExit mirrors child-first send for tick", () => {
    const ctrl = createController();
    const r = routedFacade(ctrl);

    const before = ctrl.getState();
    const probe = (ctrl as any).resolveExit?.({ type: "tick" });
    // Parent should not change on probe
    expect(ctrl.getState()).toBe(before);

    // After actual send, child toggles Red->Green
    r.send("tick");
    const light = ctrl.getState().as("Working").data.machine;
    expect(light.getState().key).toBe("Green");
  });

  it("break/repair uses a new child instance", () => {
    const ctrl = createController();
    const first = ctrl.getState().as("Working").data.machine;
    routedFacade(ctrl).send("tick");
    expect(first.getState().key).toBe("Green");

    // break -> Broken
    ctrl.send("break");
    expect(ctrl.getState().key).toBe("Broken");

    // repair -> Working with a fresh child at Red
    ctrl.send("repair");
    const second = ctrl.getState().as("Working").data.machine;
    expect(second).not.toBe(first);
    expect(second.getState().key).toBe("Red");
  });

  it("deep nesting: event handled by grandchild", () => {
    // Grandchild machine toggled by 'g'
    function createGrand() {
      const states = defineStates({ A: undefined, B: undefined });
      const transitions = { A: { g: "B" }, B: { g: "A" } } as const;
      const m = createMachine(states, transitions, "A");
      setup(m)(propagateSubmachines(m));
      return m;
    }
    // Child embeds grandchild; does not handle 'g'
    function createChild() {
      const states = defineStates({ On: () => ({ machine: createGrand() }) });
      const transitions = { On: {} } as const;
      const m = createMachine(states, transitions, "On");
      setup(m)(propagateSubmachines(m));
      return m;
    }
    // Parent embeds child; does not handle 'g'
    const states = defineStates({ Run: () => ({ machine: createChild() }) });
    const transitions = { Run: {} } as const;
    const p = createMachine(states, transitions, "Run");
    setup(p)(propagateSubmachines(p));

    const r = routedFacade(p);
    expect((p as any).getState().key).toBe("Run");
    const before = p.getState();
    (r as any).send("g");
    const after = p.getState();
    expect(after).toBe(before); // parent unchanged

    const child = (p as any).getState().as("Run").data.machine;
    const grand = child.getState().as("On").data.machine;
    expect(grand.getState().key).toBe("B");
  });
});
