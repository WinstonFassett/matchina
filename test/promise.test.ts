import { expect, it, describe } from "vitest";
import { createPromiseMachine } from "../src/extras/promise";
import { delay, delayer } from "./delay";

describe("createPromiseMachine", () => {
  it("should transition from Idle to Pending and Resolved states", async () => {
    const machine = createPromiseMachine(delayer(1, "Resolved Data"));

    const initialState = machine.getState();
    expect(initialState.key).toBe("Idle");

    machine.events.execute();
    const pendingState = machine.getState();
    expect(pendingState.key).toBe("Pending");

    // Use setTimeout with a very short delay to wait for asynchronous operations to complete
    await new Promise((resolve) => setTimeout(resolve, 2));

    const resolvedState = machine.getState();
    expect(resolvedState.key).toBe("Resolved");
    expect(resolvedState.data).toBe("Resolved Data");
  });

  it("should transition to Rejected state on error", async () => {
    const machine = createPromiseMachine(async () => {
      // console.log('execute')
      await delay(1);
      throw new Error("custom error");
    });

    const initialState = machine.getState();
    expect(initialState.key).toBe("Idle");

    machine.events.execute();
    const pendingState = machine.getState();
    expect(pendingState.key).toBe("Pending");

    // Use setTimeout with a very short delay to wait for asynchronous operations to complete
    await delay(2);

    const rejectedState = machine.getState();
    expect(rejectedState.key).toBe("Rejected");
    // expect((rejectedState.data as any).message).toBe("custom error");
  });
});

export function stub() {}
