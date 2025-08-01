import { describe, expect, it } from "vitest";
import {
  createPromiseMachine,
  PROMISE_STATES,
  PROMISE_TRANSITIONS,
} from "../src/promise-machine-impl";
import { delay, delayer } from "../src/extras/delay";
import { addEventApi, createMachine, eventApi } from "../src";

describe("createPromiseMachine", () => {
  describe("execute()", () => {
    it("should execute a promise and transition to Pending state", async () => {
      const machine = addEventApi(
        createPromiseMachine(async () => {
          await delay(1);
          return "Resolved Data";
        })
      );
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
    it("should throw if no makePromise function is provided", () => {
      const machine = createPromiseMachine();
      expect(() => {
        machine.execute();
      }).toThrowError("No promise factory provided");
    });
    it("should throw if not in Idle state", () => {
      const machine = addEventApi(
        createPromiseMachine(delayer(1, "Resolved Data"))
      );
      machine.execute();
      expect(() => {
        machine.execute();
      }).toThrowError("Can only execute from Idle state");
    });
  });
  it("should transition from Idle to Pending and Resolved states", async () => {
    const machine = addEventApi(
      createPromiseMachine(delayer(1, "Resolved Data"))
    );

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
    const machine = addEventApi(
      createPromiseMachine(async () => {
        // console.log('execute')
        await delay(1);
        throw new Error("custom error");
      })
    );
    const initialState = machine.getState();
    expect(initialState.key).toBe("Idle");
    await expect(machine.execute()).rejects.toThrow("custom error");
    const rejectedState = machine.getState();
    expect(rejectedState.key).toBe("Rejected");
    expect((rejectedState.data as any).message).toBe("custom error");
  });

  describe("with extended transitions", () => {
    it("should allow enhancing the transition config", () => {
      const machine = createMachine(
        PROMISE_STATES,
        {
          ...PROMISE_TRANSITIONS,
          Pending: { ...PROMISE_TRANSITIONS.Pending, cancel: "Idle" },
        },
        "Idle"
      );
      const api = eventApi(machine);
      expect(machine.getState().key).toBe("Idle");
      api.executing(Promise.resolve(), []);
      expect(machine.getState().key).toBe("Pending");
      api.cancel();
      expect(machine.getState().key).toBe("Idle");
    });
  });
});
