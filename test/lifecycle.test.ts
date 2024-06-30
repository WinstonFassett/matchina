import { describe, expect, it } from "vitest";
import { createApi, withApi } from "../src/factory-machine-event-api";
import { onLifecycle } from "../src/factory-machine-lifecycle";
import { createPromiseMachine } from "../src/promise-machine";

describe("onLifecycle usage", () => {
  it.only("should call guard, handle, and event hooks in lifecycle order", async () => {
    let didGuardReject = 0;
    let didGuardAccept = 0;
    let didBeforeExecute = 0;
    let didBeforeResolve = 0;
    let didHandleExecute = 0;
    let didHandlerReject = 0;
    let didAfterResolve = 0;
    let didEnterPending = 0;
    let didLeaveIdle = 0;
    let didEnterRejected = 0;
    let count = 0;

    const pm = createPromiseMachine<(x: number) => Promise<number>>();
    // Create machine WITHOUT a promise to drive it
    const api = createApi(pm);
    // api.resolve(1)
    const machine = Object.assign(withApi(pm), {
      reset() {
        console.log("resetting");
        const before = machine.getChange();
        machine.update({
          from: before.to,
          type: "reset",
          to: machine.states.Idle(),
        } as any);
      },
    });

    const expectState = (state: string) =>
      expect(machine.getState().key).toBe(state);
    const expectStateData = () => {
      return expect(machine.getState().data);
    };

    expectState("Idle");

    // For testing types with hover and autocomplete in IDE
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const fakeLifecycle = () =>
      onLifecycle(machine, {
        Idle: {
          on: {
            execute: {
              before(change) {
                change.type = "execute"; // can only be execute
                change.from.key = "Idle"; // can only be Idle
                change.to.key = "Pending"; // can only be Pending
              },
            },
          },
        },
        Rejected: {
          enter(change) {
            // TODO: Filter out Rejected and Resolved
            change.from.key = "Pending"; // "Idle" | "Pending" | "Rejected" | "Resolved"
            change.to.key = "Rejected"; // can only be Rejected
            change.to.data = new Error("test"); // must be Error type
            change.to.data.message = "test"; // message autocomplete
          },
          // leave(change) {
          //   change.from.data = new Error("test"); // must be Error type
          //   change.from.data.message = "test"; // Error properties autocomplete
          //   change.from.key = "Rejected"; // must be Rejected
          //   // TODO: filter out Idle
          //   change.to.key = "Idle"; // "Idle" | "Pending" | "Rejected" | "Resolved"
          // },
          on: {
            // execute: {}, // Error. "execute" event not allowed in "Rejected" state
            "*": {
              before(change) {
                change.from.key = "Idle"; // can only be Rejected
                // change.to.key = "Pending"; // "Idle" | "Pending" | "Rejected" | "Resolved"
              },
            },
          },
        },
        "*": {
          on: {
            "*": {
              before(change) {
                change.to.key = "Pending"; // "Pending" | "Rejected" | "Resolved"
              },
            },
            reject: {
              after(change) {
                change.type = "reject"; // must be "reject"
                change.from.key = "Pending"; // "Idle" | "Pending" | "Rejected" | "Resolved"
                change.to.data.message = "test"; // Error properties autocomplete
                change.to.key = "Rejected"; // must be Rejected
              },
            },
          },
        },
      });

    const removeLifecycle = onLifecycle(machine, {
      Rejected: {
        enter(change) {
          console.log("something Rejected from", change.from.key);
          didEnterRejected ||= ++count;
          // next(change);
        },
      },
      "*": {
        leave: (change) => {
          console.log("* leaving", change.from.key);
        },
        enter: (change) => {
          console.log("* entering", change.to.key);
        },
        on: {
          "*": {
            before: (event, next) => {
              console.log("* before", event.type);
              console.group();
              // next(event);
              console.groupEnd();
              console.log("* before done");
            },
            after: (event) => {
              console.log("* after", event.type);
            },

            // e: 'execute'
          },
        },
      },
      Idle: {
        on: {
          execute: {
            guard(change) {
              console.log("GUARD", change.type);
              const {
                type: event,
                params,
                from: { key: from },
                to: { key: to },
              } = change;
              console.log(
                `${from} wants to ${event} to ${to} with params ${params.join(
                  ", ",
                )}`,
              );
              console.group();
              const accept = params[0] > 1;
              if (accept) {
                didGuardAccept ||= ++count;
              } else {
                didGuardReject ||= ++count;
              }
              console.log("GUARD accept?", accept);

              console.groupEnd();
              return accept;
            },
            before: (ev, ...rest) => {
              console.log("BEFORE", ev.type);
              expect(ev.type).toBe("execute");
              const {
                params: [amount],
              } = ev;
              console.log("executing", amount);
              didBeforeExecute ||= ++count;
              // console.group()
              // console.groupEnd()
              // console.log('done executing')
            },
            handle: (event) => {
              console.log("*** HANDLE");
              const num = event.params[0];
              const accept = event.params[0] >= 100;
              if (!accept) {
                didHandlerReject ||= ++count;
                console.log("handler rejecting");
                // reject by returning
                return;
              }
              const promise = delayed(num, num);
              Object.assign(event, {
                promise,
                done: promise
                  .then(machine.api.resolve)
                  .catch(machine.api.reject),
              });
              didHandleExecute ||= ++count;
              console.log("handler accepting");
              return event;
            },
          },
        },
        leave: (ev) => {
          console.log("LLLLLEEEAAAVVVIIINNNGGGG", ev);
          didLeaveIdle ||= ++count;
          const {
            type: event,
            from: { key: from },
            to: { key: to },
          } = ev;
          console.log(`leaving ${from} to ${event} to ${to}`);
        },
      },
      Pending: {
        enter: (e) => {
          didEnterPending ||= ++count;
          console.log("entering Pending via", e.type);
        },
        on: {
          resolve: {
            before: (ev) => {
              didBeforeResolve ||= ++count;
              console.log("In Pending before resolve");
              expect(ev.type).toBe("resolve");
              console.group();
              console.groupEnd();
              console.log("done before resolve");
            },
            after: (ev) => {
              ev.type = "resolve";
              didAfterResolve ||= ++count;
              console.log("Resolved from Pending");
            },
          },
        },
      },
    });
    const checkState = () => {
      console.log("state", machine.getState().key);
    };
    expectState("Idle");
    expect(didBeforeExecute).toBeFalsy();
    expect(didGuardReject).toBeFalsy();
    console.log("test guard reject");
    machine.api.execute(1);
    checkState();
    expect(didGuardReject).toBeTruthy();
    expect(didBeforeExecute).toBeFalsy();

    expectState("Idle");

    expect(didGuardAccept).toBeFalsy();
    console.log("test guard accept, handler reject");
    machine.api.execute(99);
    expect(didGuardAccept).toBeTruthy();
    expect(didHandlerReject).toBeTruthy();
    expectState("Idle");

    console.log("BEFORE FAIL", machine.getState().key);
    console.log("***test handler accept");
    machine.api.execute(100);
    console.log("AFTER Execute", machine.getState().key);
    expectState("Pending");
    expect(didBeforeResolve).toBeFalsy();
    await delay(100);
    console.log("AFTER delay", machine.getState().key);

    expectState("Resolved");
    expect(didBeforeResolve).toBeTruthy();
    expectStateData().toBe(100);

    // test non-hooked event, for coverage
    machine.reset();
    machine.api.execute(100);
    expectState("Pending");
    machine.api.reject(new Error("test"));
    expectState("Rejected");
    expectStateData().toBeInstanceOf(Error);
    expect((machine.getState().data as any).message).toBe("test");

    console.log("removing lifecycle");
    // removeLifecycle();
    machine.reset();
    console.log("resetting");

    expectState("Idle");

    console.log("executing without lifecycle");
    // without lifecycle, there is nothing implementing the delay
    machine.api.execute(1000);
    expectState("Pending");

    machine.api.resolve(1);
    expectState("Resolved");
    expectStateData().toBe(1);

    console.log({
      didGuardReject,
      didGuardAccept,
      didHandlerReject,
      didHandleExecute,
      didBeforeExecute,
      didLeaveIdle,
      didEnterPending,
      didBeforeResolve,
      didAfterResolve,
      didEnterRejected,
    });

    expect(didGuardReject).toBe(1);
    expect(didGuardAccept).toBe(2);
    expect(didHandlerReject).toBe(3);
    expect(didHandleExecute).toBe(4);
    expect(didBeforeExecute).toBe(5);
    expect(didLeaveIdle).toBe(6);
    expect(didEnterPending).toBe(7);
    expect(didBeforeResolve).toBe(8);
    expect(didAfterResolve).toBe(9);
    expect(didEnterRejected).toBe(10);
  });
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function delayed<T>(ms: number, data: T) {
  await delay(ms);
  return data;
}
