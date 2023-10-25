import { expect, it, describe } from "vitest";
import { createPromiseMachine } from "../src/extras/promise";
import { onLifecycle } from "../src/extras/lifecycle";
import { Expand } from "../src";

describe("onLifecycle usage", () => {
  it("should call guard, handle, and event hooks in lifecycle order", async () => {
    let didGuardReject = 0;
    let didGuardAccept = 0;
    let didBeforeExecute = 0;
    let didBeforeResolve = 0;
    let didHandleExecute = 0;
    let didHandlerReject = 0;
    let didAfterResolve = 0;
    let didEnterPending = 0;
    let didLeaveIdle = 0;
    let count = 0;

    // Create machine WITHOUT a promise to drive it
    const machine = createPromiseMachine<number, number>();
    const expectState = (state: string) =>
      expect(machine.getState().key).toBe(state);
    const expectStateData = () => {
      return expect(machine.getState().data);
    };

    expectState("Idle");

    onLifecycle(machine, {
      Rejected: {
        enter(change) {
          change.from.key = "Idle"; // any event key

          change.to.key = "Rejected"; // typed
          change.to.data = new Error("test");
          change.to.data.message = "test";
        },
        leave(change) {
          change.from.data = new Error("test");
          change.from.data.message = "test";
          change.from.key = "Rejected"; // typed
        },
        on: {
          // execute: {
          //   after(change) {
          //     change.from.key = "Rejected";
          //     change.to.key = "Pending";
          //     change.from.data = new Error("test");
          //     change.to.data = [100];
          //   },
          // },
        },
      },
      "*": {
        on: {
          "*": {
            before(change) {
              change.from.key = "Idle";
              // change.to.key = "Idle";
              change.to.key = 'Pending'
            },
          },
          reject: {
            after(change) {
              change.type = "reject"; // typed
              change.from.key = "Idle"; // loose but not too loose
              // change.to.key =
              // fix these
              // change.to.key = ''
              // change.to.key = "Idle"; // ideally should error unless Error
              change.to.key = 'Resolved'
            },
          },
        },
      },
    });

    const removeLifecycle = onLifecycle(machine, {
      Rejected: {
        on: {
          // execute: {
          //   before(change) {
          //     change.from.key = "Rejected";
          //     change.to.key = "Pending";
          //   },
          // },
        },
      },
      "*": {
        leave(change) {
          change.from.key = "Idle";
          change.to.key = "Idle";
        },
        enter(state) {
          console.log("entering", state.to.key);
        },
        on: {
          execute: {
            after: (event) => {
              event.from.key = "Idle";
              event.to.key = 'Pending'
            },
          },
          reject: {
            after: (event) => {
              event.to.key = 'Rejected'
            }
          }
          // "*": {
          //   before: (event) => {
          //     console.log("before", event);
          //   },
          //   after: () => {},
          //   // after: (event) => {
          //   //   console.log("after", event.type);
          //   // },
          // },
        },
        // on: {
        //   '*': {
        //     before: () => {
        //       console.log("before");
        //     },
        //   }
        // }
      },
      Idle: {
        on: {
          execute: {
            guard({
              type: event,
              params,
              from: { key: from },
              to: { key: to },
            }) {
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
                console.log("handler rejecting");
                // reject by returning undefined
                return undefined;
              }
              machine.promise = delayed(num, num);
              machine.done = machine.promise
                .then(machine.event.resolve)
                .catch(machine.event.reject);
              didHandleExecute ||= ++count;
              return event;
            },
          },
        },
        leave: ({ type: event, from: { key: from }, to: { key: to } }) => {
          didLeaveIdle ||= ++count;
          console.log(`leaving ${from} to ${event} to ${to}`);
        },
      },
      Pending: {
        enter: (e) => {
          didEnterPending ||= ++count;
          console.log("entering Pending via", e.type, e.params);
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
    machine.event.execute(1);
    expect(didGuardReject).toBeTruthy();
    expect(didBeforeExecute).toBeFalsy();

    expectState("Idle");

    expect(didGuardAccept).toBeFalsy();
    machine.event.execute(99);
    expect(didGuardAccept).toBeTruthy();
    expect(didHandlerReject).toBeTruthy();
    expectState("Idle");

    machine.event.execute(100);

    expect(didBeforeResolve).toBeFalsy();
    await delay(100);
    expect(didBeforeResolve).toBeTruthy();

    expectState("Resolved");
    expectStateData().toBe(100);

    // test non-hooked event, for coverage
    machine.reset();
    machine.event.execute(100);
    expectState("Pending");
    machine.event.reject(new Error("test"));
    expectState("Rejected");
    expectStateData().toBeInstanceOf(Error);
    expect((machine.getState().data as any).message).toBe("test");

    console.log("removing lifecycle");
    removeLifecycle();
    machine.reset();
    console.log("resetting");

    expectState("Idle");

    console.log("executing without lifecycle");
    // without lifecycle, there is nothing implementing the delay
    machine.event.execute(1000);
    expectState("Pending");

    machine.event.resolve(1);
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
