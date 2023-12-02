import { expect, it, describe } from "vitest";
// import { createMachine } from "../dev/monolithic/createMachineFromConfig";

describe("tea example", () => {
  it("should be ok", () => {
    expect(1).toBe(1);
    // const teaMakingMachine = createMachine({
    //   initial: (states) => {
    //     console.log({ states });
    //     return states.Initial();
    //   },
    //   states: {
    //     Initial: { on: { start: "HeatingWater" } },
    //     HeatingWater: {
    //       create: () => ({
    //         machine: createMachine({
    //           states: {
    //             Heating: { on: { done: "Done" } },
    //             Done: {},
    //           },
    //         }),
    //       }),
    //       on: { done: "SteepingTea" },
    //     },
    //     SteepingTea: {
    //       create: () => ({
    //         machine: createMachine({
    //           states: {
    //             Steeping: { on: { done: { target: "Done " } } },
    //             Done: {},
    //           },
    //         }),
    //       }),
    //       on: { done: "Done" },
    //     },
    //     Done: { on: { reheat: "HeatingWater" } },
    //   },
    // } as const);

    // // Usage example
    // const initialState = teaMakingMachine.getState();
    // expect(initialState).toBeDefined();
    // expect(initialState.key).toBe("Initial");

    // // Interact with the submachines
    // teaMakingMachine.events.start();
    // expect(teaMakingMachine.getState().key).toBe("HeatingWater");
    // expect(teaMakingMachine.getState().data.machine.getState().key).toBe(
    //   "Heating",
    // );
    // // expect(heatingWaterMachine.getState().key).toBe('Heating');

    // // Move to the next state in the submachine
    // // heatingWaterMachine.events.done();
    // teaMakingMachine.events.done();
    // // expect(heatingWaterMachine.getState().key).toBe('Done');
    // expect(teaMakingMachine.getState().key).toBe("SteepingTea");
    // expect(teaMakingMachine.getState().data.machine.getState().key).toBe(
    //   "Steeping",
    // );
    // teaMakingMachine.events.done();
    // // expect(steepingMachine.getState().key).toBe('Done');
    // expect(teaMakingMachine.getState().key).toBe("Done");

    // teaMakingMachine.events.reheat();
    // expect(teaMakingMachine.getState().key).toBe("HeatingWater");
    // expect(heatingWaterMachine.getState().key).toBe('HeatingWater');

    // // Move to the next state in the submachine
    // steepingMachine.events.done();
    // expect(steepingMachine.getState().key).toBe('Done');

    // // Check the state of the main machine
    // expect(teaMakingMachine.getState().key).toBe('SteepingTea');
  });
});
