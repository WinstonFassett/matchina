import { createPromiseMachine } from "../dev/monolithic/createPromiseMachineFromConfig";

describe("createPromiseMachine", () => {
  it("should transition from Idle to Pending and Resolved states", async () => {
    const trigger = jest.fn(() => "resolved data");
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
    const trigger = jest.fn(() => {
      throw new Error("custom error");
    });
    const machine = createPromiseMachine(trigger);

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
