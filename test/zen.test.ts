import { describe, expect, it } from "vitest";
import { createPromiseMachine } from "../src/extras/promise";
import { makeZen } from "../src/extras/zen";
import { delayer } from "../src/extras/delay";

function makeMachine() {
  return createPromiseMachine((ms: number) => {
    console.log("promising", ms);
    return new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe("zen", () => {
  it("should return an object with machine, state and all machine events", () => {
    const machine = makeMachine();
    const zenMachine = makeZen(machine);
    expect(zenMachine).toHaveProperty("machine");
    // expect(zenMachine.machine).toBe(machine);
    expect(zenMachine).toHaveProperty("state");
    expect(zenMachine).toHaveProperty("execute");
  });

  it("should transition from Idle to Pending and Resolved states", async () => {
    const machine = createPromiseMachine(delayer(1, "Resolved Data"));
    const zen = makeZen(machine);
    const initialState = machine.getState();
    expect(initialState.key).toBe("Idle");

    zen.execute();

    const pendingState = machine.getState();
    expect(pendingState.key).toBe("Pending");

    await new Promise((resolve) => setTimeout(resolve, 2));

    const resolvedState = machine.getState();
    expect(resolvedState.key).toBe("Resolved");
    expect(resolvedState.data).toBe("Resolved Data");
    expect(zen.state.key).toBe("Resolved");
    expect(zen.state.data).toBe("Resolved Data");
  });
});
