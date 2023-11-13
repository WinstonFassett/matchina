import { describe, expect, it } from "vitest";
import { onLifecycle1 as onLifecycle } from "../src/extras/lifecycle";
import { createPromiseMachine } from "../src/extras/promise";
import { withEvents } from "../src/extras/with-events";

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

    // Create machine WITHOUT a promise to drive it
    const machine = withEvents(createPromiseMachine<number, [number]>());
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
                change.from.key = "Idle"; // can only be Idle
                change.to.key = "Pending"; // can only be Pending
              },
            },
          },
        },
        Rejected: {
          enter(change) {
            // TODO: Filter out Rejected and Resolved
            change.from.key = "Idle"; // "Idle" | "Pending" | "Rejected" | "Resolved"
            change.to.key = "Rejected"; // can only be Rejected
            change.to.data = new Error("test"); // must be Error type
            change.to.data.message = "test"; // message autocomplete
          },
          leave(change) {
            change.from.data = new Error("test"); // must be Error type
            change.from.data.message = "test"; // Error properties autocomplete
            change.from.key = "Rejected"; // must be Rejected
            // TODO: filter out Idle
            change.to.key = "Idle"; // "Idle" | "Pending" | "Rejected" | "Resolved"
          },
          on: {
            // execute: {}, // Error. "execute" event not allowed in "Rejected" state
            "*": {
              before(change) {
                change.from.key = "Rejected"; // can only be Rejected
                change.to.key = "Pending"; // "Idle" | "Pending" | "Rejected" | "Resolved"
              },
            },
          },
        },
        "*": {
          on: {
            "*": {
              before(change) {
                change.to.key = "Pending"; // "Idle" | "Pending" | "Rejected" | "Resolved"
              },
            },
            reject: {
              after(change) {
                change.type = "reject"; // must be "reject"
                change.from.key = "Idle"; // "Idle" | "Pending" | "Rejected" | "Resolved"
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
        },
      },
      "*": {
        leave(change) {
          console.log("* leaving", change.from.key);
        },
        enter(state) {
          console.log("* entering", state.to.key);
        },
        on: {
          "*": {
            before: (event) => {
              console.log("* before", event.type);
            },
            after: (event) => {
              console.log("* after", event.type);
            },
          },
        },
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
          console.log("entering Pending via", e.type);
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
    const checkState = ()=> {
      console.log('state', machine.getState().key)
    }
    expectState('Idle')
    expect(didBeforeExecute).toBeFalsy();
    expect(didGuardReject).toBeFalsy();
    machine.event.execute(1);
    checkState()
    expect(didGuardReject).toBeTruthy();
    expect(didBeforeExecute).toBeFalsy();

    expectState("Idle");

    expect(didGuardAccept).toBeFalsy();
    machine.event.execute(99);
    expect(didGuardAccept).toBeTruthy();
    expect(didHandlerReject).toBeTruthy();
    expectState("Idle");

    console.log('BEFORE FAIL', machine.getState().key)
    machine.event.execute(100);
    console.log('AFTER Execute', machine.getState().key)
    expect(didBeforeResolve).toBeFalsy();
    await delay(100);
    console.log('AFTER delay', machine.getState().key)
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
      didEnterRejected,
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
