import { describe, expect, it } from "vitest";
import { delay, delayer } from "../../test/delay";
import { createPromiseMachine } from "./promise";
import { makeZen } from "./zen";

function makeMachine() {
  return createPromiseMachine((x: number) => delayer(x, "Resolved Data")());
}

describe("zen", () => {
  it("should return an object with machine, state and all machine events", () => {
    const machine = makeMachine();
    const zenMachine = makeZen(machine);
    expect(zenMachine).toHaveProperty("machine");
    expect(zenMachine).toHaveProperty("state");
    expect(zenMachine).toHaveProperty("execute");
  });

  it("should return the current state of the machine", () => {
    const machine = makeMachine();
    const zenMachine = makeZen(machine);
    expect(zenMachine.state.key).toBe("Idle");

    zenMachine.execute(1);
    expect(zenMachine.state.key).toBe("Pending");

    return delay(2).then(() => {
      expect(zenMachine.state.key).toBe("Resolved");
      expect(zenMachine.state.data).toBe("Resolved Data");
    });
  });
});
