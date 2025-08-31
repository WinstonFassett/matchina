import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";

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

describe("createHierarchicalMachine provides child event routing", () => {
  it("routes events to child and handles parent events", () => {
    const ctrl = createSignalController();
    const hierarchical = createHierarchicalMachine(ctrl);

    // Runtime: send("tick") routes to child when Working
    expect(ctrl.getState().key).toBe("Working");
    hierarchical.send("tick");
    const light1 = ctrl.getState().as("Working").data.machine as TrafficLight;
    expect(light1.getState().key).toBe("Green");

    // Parent event still works
    hierarchical.send("break");
    expect(ctrl.getState().key).toBe("Broken");

    // Repair and child restarts at Red
    hierarchical.send("repair");
    const light2 = ctrl.getState().as("Working").data.machine as TrafficLight;
    expect(light2.getState().key).toBe("Red");
  });
});
