import { expect, it, describe } from "vitest";
import { createPromiseMachine } from "../src/promise";
import { onLifecycle } from "../src/lifecycle";

describe("onLifecycle usage", () => {
  it("should call guard, handle, and event hooks in lifecycle order", async () => {
    let didGuardReject = 0,
      didGuardAccept = 0,
      didBeforeExecute = 0,
      didBeforeResolve = 0,
      didHandleExecute = 0,
      didHandlerReject = 0,
      didAfterResolve = 0,
      didEnterPending = 0,
      didLeaveIdle = 0,
      count = 0;

    // Create machine WITHOUT a promise to drive it
    const machine = createPromiseMachine<number, number>();
    const expectState = (state) => expect(machine.getState().state).toBe(state);
    const expectStateData = () => {
      return expect(machine.getState().data);
    };
    
    expectState("Idle");

    const removeLifecycle = onLifecycle(machine, {
      Idle: {
        on: {
          execute: {
            guard({ event, params, from: { state: from }, to: { state: to } }) {
              console.log(
                `${from} wants to ${event} to ${to} with params ${params.join(
                  ", ",
                )}`,
              );
              const accept = params[0] > 1;
              if (accept) {
                didGuardAccept ||= ++count;
              } else {
                didGuardReject ||= ++count;
              }
              console.log("GUARD accept?", accept);
              return accept;
            },
            before({ params: [amount] }) {
              didBeforeExecute ||= ++count;
              console.log("executing", amount);
            },
            handle: (event) => {
              const num = event.params[0];
              const accept = event.params[0] >= 100;
              if (!accept) {
                didHandlerReject ||= ++count;
                // reject by returning undefined
                return undefined;
              }
              machine.promise = delayed(num, num);
              machine.done = machine.promise
                .then(machine.events.resolve)
                .catch(machine.events.reject);
              didHandleExecute ||= ++count;
              return event;
            },
          },
        },
        leave: ({ event, from: { state: from }, to: { state: to } }) => {
          didLeaveIdle ||= ++count;
          console.log(`leaving ${from} to ${event} to ${to}`);
        },
      },
      Pending: {
        enter: (e) => {
          didEnterPending ||= ++count;
          console.log("entering Pending via", e.event, e.params);
        },
        on: {
          resolve: {
            before: () => {
              didBeforeResolve ||= ++count;
              console.log("In Pending before resolve");
            },
            after: () => {
              didAfterResolve ||= ++count;
              console.log("Resolved from Pending");
            },
          },
        },
      },
    });
    expect(didBeforeExecute).toBeFalsy();
    expect(didGuardReject).toBeFalsy();
    machine.events.execute(1);
    expect(didGuardReject).toBeTruthy();
    expect(didBeforeExecute).toBeFalsy();

    expectState("Idle");

    expect(didGuardAccept).toBeFalsy();
    machine.events.execute(99);
    expect(didGuardAccept).toBeTruthy();
    expect(didHandlerReject).toBeTruthy();
    expectState("Idle");

    machine.events.execute(100);

    expect(didBeforeResolve).toBeFalsy();
    await delay(100);
    expect(didBeforeResolve).toBeTruthy();

    expectState("Resolved");
    expectStateData().toBe(100);

    console.log("removing lifecycle");
    removeLifecycle();
    machine.reset();
    console.log("resetting");

    expectState("Idle");

    console.log("executing without lifecycle");
    // without lifecycle, there is nothing implementing the delay
    machine.events.execute(1000);
    expectState("Pending");

    machine.events.resolve(1);
    expectState("Resolved");
    expectStateData().toBe(1);

    console.log({
      didGuardReject,
      didGuardAccept,
      didHandlerReject,
      didHandleExecute,
      didLeaveIdle,
      didBeforeExecute,
      didEnterPending,
      didBeforeResolve,
      didAfterResolve,
    });

    expect(didGuardReject).toBe(1);
    expect(didGuardAccept).toBe(2);
    expect(didHandlerReject).toBe(3);
    expect(didHandleExecute).toBe(4);
    expect(didLeaveIdle).toBe(5);
    expect(didBeforeExecute).toBe(6);
    expect(didEnterPending).toBe(7);
    expect(didBeforeResolve).toBe(8);
    expect(didAfterResolve).toBe(9);
  });
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function delayed<T>(ms: number, data: T) {
  await delay(ms);
  return data;
}
