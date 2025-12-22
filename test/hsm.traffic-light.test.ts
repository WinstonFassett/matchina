import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";

describe("HSM: Traffic Light (nested tick)", () => {
  it("should handle tick events in nested child machine", () => {
    // This test replicates the nested traffic light example from the docs
    const lightStates = defineStates({ Red: undefined, Green: undefined, Yellow: undefined });

    const states = defineStates({
      Broken: undefined,
      Working: submachine(() =>
        createMachine(
          lightStates,
          {
            Red: { tick: "Green" },
            Green: { tick: "Yellow" },
            Yellow: { tick: "Red" },
          },
          "Red"
        )
      ),
      Maintenance: undefined,
    });

    const ctrl = createMachine(
      states,
      {
        Broken: { repair: "Working", maintenance: "Maintenance" },
        Working: { break: "Broken", maintenance: "Maintenance" },
        Maintenance: { complete: "Working" },
      },
      "Working"
    );

    const hierarchical = createHierarchicalMachine(ctrl);

    // Initial state should be Working with child at Red
    const initialState = hierarchical.getState();
    expect(initialState.key).toBe("Working");
    const initialChild = initialState.is("Working") ? initialState.data.machine : undefined;
    expect(initialChild?.getState().key).toBe("Red");

    // Send tick - child should transition Red -> Green
    hierarchical.send("tick" as any);
    const afterFirstTick = hierarchical.getState();
    expect(afterFirstTick.key).toBe("Working");
    const childAfterFirst = afterFirstTick.is("Working") ? afterFirstTick.data.machine : undefined;
    expect(childAfterFirst?.getState().key).toBe("Green");

    // Send tick again - child should transition Green -> Yellow
    hierarchical.send("tick" as any);
    const afterSecondTick = hierarchical.getState();
    const childAfterSecond = afterSecondTick.is("Working") ? afterSecondTick.data.machine : undefined;
    expect(childAfterSecond?.getState().key).toBe("Yellow");

    // Send tick again - child should transition Yellow -> Red
    hierarchical.send("tick" as any);
    const afterThirdTick = hierarchical.getState();
    const childAfterThird = afterThirdTick.is("Working") ? afterThirdTick.data.machine : undefined;
    expect(childAfterThird?.getState().key).toBe("Red");
  });

  it("should handle parent events (break) correctly", () => {
    const lightStates = defineStates({ Red: undefined, Green: undefined, Yellow: undefined });

    const states = defineStates({
      Broken: undefined,
      Working: submachine(() =>
        createMachine(
          lightStates,
          {
            Red: { tick: "Green" },
            Green: { tick: "Yellow" },
            Yellow: { tick: "Red" },
          },
          "Red"
        )
      ),
      Maintenance: undefined,
    });

    const ctrl = createMachine(
      states,
      {
        Broken: { repair: "Working", maintenance: "Maintenance" },
        Working: { break: "Broken", maintenance: "Maintenance" },
        Maintenance: { complete: "Working" },
      },
      "Working"
    );

    const hierarchical = createHierarchicalMachine(ctrl);

    // Send break - should bubble to parent and transition Working -> Broken
    hierarchical.send("break" as any);
    expect(hierarchical.getState().key).toBe("Broken");
  });
});
