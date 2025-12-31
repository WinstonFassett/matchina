import { describe, it, expect } from "vitest";
import { createCounterMachine } from "../../docs/src/code/examples/counter/machine";

describe("Counter Example", () => {
  it("should start with count 0", () => {
    const machine = createCounterMachine();
    expect(machine.store.get().count).toBe(0);
  });

  it("should increment count", () => {
    const machine = createCounterMachine();
    machine.send("increment");
    expect(machine.store.get().count).toBe(1);
  });

  it("should decrement count", () => {
    const machine = createCounterMachine();
    machine.send("increment");
    machine.send("increment");
    machine.send("decrement");
    expect(machine.store.get().count).toBe(1);
  });

  it("should reset count to 0", () => {
    const machine = createCounterMachine();
    machine.send("increment");
    machine.send("increment");
    machine.send("increment");
    expect(machine.store.get().count).toBe(3);
    machine.send("reset");
    expect(machine.store.get().count).toBe(0);
  });

  it("should stay in Active state", () => {
    const machine = createCounterMachine();
    expect(machine.getState().key).toBe("Active");
    machine.send("increment");
    expect(machine.getState().key).toBe("Active");
    machine.send("reset");
    expect(machine.getState().key).toBe("Active");
  });
});
