import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";
import { routedFacade, RoutedEventsOf } from "../src/nesting/routedFacade";

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

  setup(ctrl)(propagateSubmachines(ctrl));
  return ctrl;
}

describe("routedFacade widens send to include child events", () => {
  it("typed union includes parent and child events", () => {
    const ctrl = createSignalController();
    const r = routedFacade(ctrl);

    // Type-level: RoutedEventsOf includes both parent and child events
    type R = RoutedEventsOf<typeof ctrl>; // "repair" | "break" | "tick"
    const e1: R = "tick";
    const e2: R = Math.random() > 2 ? ("repair" as R) : ("break" as R);
    void e1; void e2;

    // Runtime: send("tick") routes to child when Working
    expect(ctrl.getState().key).toBe("Working");
    r.send("tick");
    const light1 = ctrl.getState().as("Working").data.machine as TrafficLight;
    expect(light1.getState().key).toBe("Green");

    // Parent event still works
    r.send("break");
    expect(ctrl.getState().key).toBe("Broken");

    // Repair and child restarts at Red
    r.send("repair");
    const light2 = ctrl.getState().as("Working").data.machine as TrafficLight;
    expect(light2.getState().key).toBe("Red");
  });
});
