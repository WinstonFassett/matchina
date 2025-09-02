import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";

function childWithNoStart() {
  const states = defineStates({ Idle: undefined });
  return createMachine(states, { Idle: {} }, "Idle");
}

function parentAlsoHandlesStart() {
  const states = defineStates({
    Idle: undefined,
    First: () => ({ machine: childWithNoStart() }),
    Executing: undefined,
  });
  const m = createMachine(
    states,
    {
      Idle: { toFirst: "First" },
      // Parent has a start -> Executing transition, but child has no start.
      // Our router should bubble to parent in this case.
      First: { start: "Executing" },
      Executing: {},
    },
    "Idle"
  );
  setup(m)(propagateSubmachines);
  return m;
}

describe("HSM edge cases", () => {
  it("bubbles to parent when child cannot handle and parent can", () => {
    const m = parentAlsoHandlesStart();
    m.send("toFirst");
    expect(m.getState().key).toBe("First");
    // cast required because parent type is agnostic of child type
    // see flattened test for cast-free approach
    m.send("start" as any); 
    expect(m.getState().key).toBe("Executing");
  });
});
