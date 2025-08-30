import { describe, it, expect } from "vitest";
import { defineMachine, defineSubmachine, flattenMachineDefinition, createMachineFrom, createMachineFromFlat } from "../src/definitions";
import { defineStates } from "../src";

// Flattened Traffic Light inside Controller (Working/Broken)

describe("Flattened HSM: Traffic Light (Working/Broken)", () => {
  it("hoists child events and uses fully-qualified keys", () => {
    const ctrlDef = defineMachine(
      defineStates({
        Broken: undefined,
        Working: defineSubmachine(
          defineStates({ Red: undefined, Green: undefined, Yellow: undefined }),
          {
            Red: { tick: "Green" },
            Green: { tick: "Yellow" },
            Yellow: { tick: "Red" },
          },
          "Red"
        ),
      }),
      {
        Broken: { repair: "Working" },
        Working: { break: "Broken" },
      },
      "Working"
    );
    
    const flat = flattenMachineDefinition(ctrlDef);
    const m = createMachineFromFlat(flat);

    // Initial cascades to leaf under Working
    expect(m.getState().key).toBe("Working.Red");

    // Child event hoisted to root
    m.send("tick");
    expect(m.getState().key).toBe("Working.Green");

    m.send("tick");
    expect(m.getState().key).toBe("Working.Yellow");

    // Parent event still available
    m.send("break");
    expect(m.getState().key).toBe("Broken");

    // Repair restarts child at Red
    m.send("repair");
    expect(m.getState().key).toBe("Working.Red");
  });
});
