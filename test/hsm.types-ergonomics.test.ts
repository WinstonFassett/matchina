import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";
import { StatesOf, EventsOf, AllEventsOf, ActiveEvents, sendWhen } from "../src/nesting/types";

function createTrafficLight() {
  const states = defineStates({ Red: undefined, Green: undefined, Yellow: undefined });
  return createMachine(
    states,
    {
      Red: { tick: "Green" },
      Green: { tick: "Yellow" },
      Yellow: { tick: "Red" },
    },
    "Red"
  );
}

type TrafficLight = ReturnType<typeof createTrafficLight>;

function createSignalController() {
  const states = defineStates({
    Broken: undefined,
    Working: submachine(() => createTrafficLight()),
  });

  const ctrl = createMachine(
    states,
    {
      Broken: { repair: "Working" },
      Working: { break: "Broken" },
    },
    "Working"
  );

  propagateSubmachines(ctrl);
  return ctrl;
}

describe("Type ergonomics: states/events without casts", () => {
  it("extractors build unions for states and events", () => {
    const ctrl = createSignalController();
    type S = StatesOf<typeof ctrl>; // "Broken" | "Working"
    type EBroken = EventsOf<typeof ctrl, "Broken">; // "repair"
    type EWorking = EventsOf<typeof ctrl, "Working">; // "break"
    type All = AllEventsOf<typeof ctrl>; // "repair" | "break"

    // compile-time only assertions via dummy assignability
    const ok1: S = ctrl.getState().key;
    void ok1;
    const _: All = Math.random() > 2 ? ("repair" as All) : ("break" as All);
    void _;
    // runtime sanity
    expect(["Broken","Working"]).toContain(ctrl.getState().key);
  });

  it("ActiveEvents includes child events when in Working", () => {
    const ctrl = createSignalController();
    type AEWorking = ActiveEvents<typeof ctrl, "Working">; // "tick" | "break"

    // runtime sanity: starts Working
    expect(ctrl.getState().key).toBe("Working");

    // narrowed send: compiles for valid events
    sendWhen(ctrl, "Working", "tick"); // Red -> Green
    sendWhen(ctrl, "Working", "tick"); // Green -> Yellow

    // child advanced
    expect(ctrl.getState().as("Working").data.machine.getState().key).toBe("Yellow");

    // now break the parent; state should become Broken
    sendWhen(ctrl, "Working", "break");
    expect(ctrl.getState().key).toBe("Broken");
  });
});
