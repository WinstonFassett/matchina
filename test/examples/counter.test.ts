import { describe, it, expect } from "vitest";
import { createCounterMachine } from "../../docs/src/code/examples/counter/machine";

describe("Counter Example", () => {
  it("should start with count 0", () => {
    const machine = createCounterMachine();
    expect(machine.store.getState().count).toBe(0);
  });

  it("should increment count via store API", () => {
    const machine = createCounterMachine();
    machine.store.api.increment();
    expect(machine.store.getState().count).toBe(1);
  });

  it("should increment count via machine event", () => {
    const machine = createCounterMachine();
    machine.send("increment");
    expect(machine.store.getState().count).toBe(1);
  });

  it("should decrement count", () => {
    const machine = createCounterMachine();
    machine.store.api.increment();
    machine.store.api.increment();
    machine.store.api.decrement();
    expect(machine.store.getState().count).toBe(1);
  });

  it("should reset count to 0", () => {
    const machine = createCounterMachine();
    machine.store.api.increment();
    machine.store.api.increment();
    machine.store.api.increment();
    expect(machine.store.getState().count).toBe(3);
    machine.store.api.reset();
    expect(machine.store.getState().count).toBe(0);
  });

  it("should stay in Active state", () => {
    const machine = createCounterMachine();
    expect(machine.getState().key).toBe("Active");
    machine.send("increment");
    expect(machine.getState().key).toBe("Active");
    machine.send("reset");
    expect(machine.getState().key).toBe("Active");
  });

  it("should not update store when Inactive", () => {
    const machine = createCounterMachine();
    machine.store.api.increment();
    expect(machine.store.getState().count).toBe(1);
    machine.send("deactivate");
    expect(machine.getState().key).toBe("Inactive");
    machine.send("increment"); // Should not work - Inactive state doesn't have increment
    expect(machine.store.getState().count).toBe(1); // Count unchanged
    machine.send("activate");
    expect(machine.getState().key).toBe("Active");
  });
});
