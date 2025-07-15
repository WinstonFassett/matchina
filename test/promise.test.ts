import { describe, expect, it } from "vitest";
import {
  PromiseStates,
  createPromiseMachine,
  PromiseTransitions,
} from "../src/promise-machine";
import { delay, delayer } from "../src/extras/delay";
import { withApi, createMachine, createApi } from "../src";

describe("createPromiseMachine", () => {
  it("should transition from Idle to Pending and Resolved states", async () => {
    const machine = withApi(createPromiseMachine(delayer(1, "Resolved Data")));

    const initialState = machine.getState();
    expect(initialState.key).toBe("Idle");

    machine.execute();
    const pendingState = machine.getState();
    expect(pendingState.key).toBe("Pending");

    await new Promise((resolve) => setTimeout(resolve, 2));

    const resolvedState = machine.getState();
    expect(resolvedState.key).toBe("Resolved");
    expect(resolvedState.data).toBe("Resolved Data");
  });

  it("should transition to Rejected state on error", async () => {
    const machine = withApi(
      createPromiseMachine(async () => {
        // console.log('execute')
        await delay(1);
        throw new Error("custom error");
      }),
    );

    const initialState = machine.getState();
    expect(initialState.key).toBe("Idle");

    machine.execute();
    const pendingState = machine.getState();
    expect(pendingState.key).toBe("Pending");

    await delay(2);

    const rejectedState = machine.getState();
    expect(rejectedState.key).toBe("Rejected");
    // expect((rejectedState.data as any).message).toBe("custom error");
  });

  describe("with extended transitions", () => {
    it("should allow enhancing the transition config", () => {
      const machine = createMachine(
        PromiseStates,
        {
          ...PromiseTransitions,
          Pending: { ...PromiseTransitions.Pending, cancel: "Idle" },
        },
        "Idle",
      );
      const api = createApi(machine);
      expect(machine.getState().key).toBe("Idle");
      api.executing(Promise.resolve(), [])
      expect(machine.getState().key).toBe("Pending");
      api.cancel();
      expect(machine.getState().key).toBe("Idle");
    });
  });
});
