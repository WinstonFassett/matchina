import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";
import { routedFacade } from "../src/nesting/routedFacade";

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
    Working: submachine(() => createTrafficLight()), // Child inferred
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

describe("Traffic Light HSM (Working/Broken)", () => {
  it("explicit child usage: tick cycles Red→Green→Yellow", () => {
    const ctrl = createSignalController();

    const working = ctrl.getState().as("Working");
    const light = working.data.machine;
    expect(light.getState().key).toBe("Red");

    light.send("tick");
    expect(light.getState().key).toBe("Green");

    light.send("tick");
    expect(light.getState().key).toBe("Yellow");
  });

  it("parent-only sends: tick routes to child when Working", () => {
    const ctrl = createSignalController();
    const r = routedFacade(ctrl);

    expect(ctrl.getState().key).toBe("Working");
    // parent-only routing
    r.send("tick"); // Red -> Green
    const light1 = ctrl.getState().as("Working").data.machine;
    expect(light1.getState().key).toBe("Green");

    r.send("tick"); // Green -> Yellow
    const light2 = ctrl.getState().as("Working").data.machine;
    expect(light2.getState().key).toBe("Yellow");
  });

  it("break/repair swaps child lifecycle; repaired starts at Red", () => {
    const ctrl = createSignalController();
    const r = routedFacade(ctrl);

    // advance child
    r.send("tick"); // Red->Green
    expect(ctrl.getState().as("Working").data.machine.getState().key).toBe("Green");

    // break parent
    r.send("break");
    expect(ctrl.getState().key).toBe("Broken");

    // repair mounts a fresh child at initial Red
    r.send("repair");
    expect(ctrl.getState().key).toBe("Working");
    const light = ctrl.getState().as("Working").data.machine;
    expect(light.getState().key).toBe("Red");
  });
});
