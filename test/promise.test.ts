import { expect, it, describe } from "vitest";
import { createPromiseMachine } from "../src/promise";
import { delay, delayed } from "../src/delay";

describe("createPromiseMachine", () => {
  it("should transition from Idle to Pending and Resolved states", async () => {
    const trigger = delayed(1, "Resolved Data");
    const machine = createPromiseMachine(trigger);

    const initialState = machine.getState();
    expect(initialState.state).toBe("Idle");

    machine.events.execute();
    const pendingState = machine.getState();
    expect(pendingState.state).toBe("Pending");

    // Use setTimeout with a very short delay to wait for asynchronous operations to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    const resolvedState = machine.getState();
    expect(resolvedState.state).toBe("Resolved");
    expect(resolvedState.data).toBe("resolved data");
  });

  it("should transition to Rejected state on error", async () => {
    const machine = createPromiseMachine(async () => {
      await delay(1);
      throw new Error("custom error");
    });

    const initialState = machine.getState();
    expect(initialState.state).toBe("Idle");

    await machine.events.execute();
    const pendingState = machine.getState();
    expect(pendingState.state).toBe("Pending");

    // Use setTimeout with a very short delay to wait for asynchronous operations to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    const rejectedState = machine.getState();
    expect(rejectedState.state).toBe("Rejected");
    // expect((rejectedState.data as any).message).toBe("custom error");
  });
});

export function stub() {}
