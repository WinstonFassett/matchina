import { expect, it, describe } from "vitest";
import { createPromiseMachine } from "../src/extras/promise";
import { delay, delayer } from "./delay";
import { AnyStateMachine, StateMachine, StatesFactory, TransitionConfig } from "../src";

describe("createPromiseMachine", () => {
  it("should transition from Idle to Pending and Resolved states", async () => {
    const machine = createPromiseMachine(delayer(1, "Resolved Data"));

    const initialState = machine.getState();
    expect(initialState.key).toBe("Idle");

    machine.do.execute();
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

    machine.do.execute();
    const pendingState = machine.getState();
    expect(pendingState.key).toBe("Pending");

    // Use setTimeout with a very short delay to wait for asynchronous operations to complete
    await delay(2);

    const rejectedState = machine.getState();
    expect(rejectedState.key).toBe("Rejected");
    // expect((rejectedState.data as any).message).toBe("custom error");
  });
});

export function zen <
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(machine: StateMachine<States,Transitions>) {
  const wrapper = {
    ...(machine.do ?? {}),
    get machine() { return machine },
    get state () { return machine.getState() },
  }
  return wrapper
}
describe("zen", () => {
  it("should return an object with machine, state and execute properties", () => {
    const machine = createPromiseMachine((x:number) => delayer(x, "Resolved Data")());
    const zenMachine = zen(machine);

    expect(zenMachine).toHaveProperty("machine");
    expect(zenMachine).toHaveProperty("state");
    expect(zenMachine).toHaveProperty("execute");
  });

  it("should return the current state of the machine", () => {
    const machine = createPromiseMachine(delayer(1, "Resolved Data"));
    const zenMachine = zen(machine);

    expect(zenMachine.state.key).toBe("Idle");

    console.log({ zenMachine })
    zenMachine.execute(1)
    expect(zenMachine.state.key).toBe("Pending");

    return delay(2).then(() => {
      expect(zenMachine.state.key).toBe("Resolved");
      expect(zenMachine.state.data).toBe("Resolved Data");
    });
  });

  it("should return the machine instance", () => {
    const machine = createPromiseMachine(delayer(1, "Resolved Data"));
    const zenMachine = zen(machine);

    expect(zenMachine.machine).toBe(machine);
  });
});
