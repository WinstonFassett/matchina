import { describe, expect, it } from "vitest";
import { matchina } from "../src/matchina";
import { promiseStates, PromiseTransitions } from "../src/promise";

function makeMachine() {
  // return createPromiseMachine((ms: number) => {
  //   console.log("promising", ms);
  //   return new Promise((resolve) => setTimeout(resolve, ms));
  // });
  const m = matchina(
    {
      Idle: undefined,
      Pending: (...params: any[]) => params,
      Rejected: (error: any) => error,
      Resolved: (data: any) => data,
    },
    {
      Idle: { execute: "Pending" },
      Pending: {
        resolve: "Resolved",
        reject: "Rejected",
      },
      Resolved: {},
      Rejected: {},
    },
    (states) => states.Idle(),
  );

  return m;
}

describe("matchina", () => {
  it("should return an object with machine, state and all machine events", () => {
    const machine = makeMachine();

    // const zenMachine = matchina(machine);
    expect(machine).toHaveProperty("machine");
    // expect(zenMachine.machine).toBe(machine);
    expect(machine).toHaveProperty("state");
    expect(machine).toHaveProperty("execute");
  });

  it("should transition from Idle to Pending and Resolved states", () => {
    // const machine = createPromiseMachine(delayer(1, "Resolved Data"));
    const machine = makeMachine();

    const initialState = machine.state;
    expect(initialState.key).toBe("Idle");

    machine.execute();

    const pendingState = machine.state;
    expect(pendingState.key).toBe("Pending");

    // await new Promise((resolve) => setTimeout(resolve, 2));
    machine.resolve({ ok: true });
    expect(machine.state.key).toBe("Resolved");
    expect(machine.state.data).toStrictEqual({ ok: true });
  });
});
