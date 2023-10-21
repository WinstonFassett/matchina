import { expect, it, describe } from "vitest";
import { createPromiseMachine } from "../src/promise";
import { onLifecycle } from "../src/lifecycle";


describe("onLifecycle usage", () => {
  
  it("should call guard, handle, and event hooks in lifecycle order", async () => {
    let didGuardReject, didGuardAccept, didBeforeExecute, didBeforeResolve, didHandleExecute, didAfterResolve, didEnterPending, didLeaveIdle;
    let count = 0
    
    // Create machine WITHOUT a promise to drive it
    const machine = createPromiseMachine<number, number>();
    const expectState = (state) => expect(machine.getState().state).toBe(state)
    expectState('Idle')

    const removeLifecycle = onLifecycle(machine, {
      Idle: {
        on: {
          execute: {
            guard ({ event, params, from: { state: from }, to: { state: to } }) {
              console.log(`${from} wants to ${event} to ${to} with params ${params.join(', ')}`)
              const accept = params[0] > 1
              if(!accept) didGuardReject = ++count
              else didGuardAccept = ++count
              console.log('GUARD accept?', accept)
              return accept
            },
            before ({ params: [amount] }) {
              didBeforeExecute = ++count
              console.log('executing', amount)
            },
            handle: (event) => {
              const num = event.params[0]
              machine.promise = delayed(num, num)
              machine.done = machine.promise
                .then(machine.events.resolve)
                .catch(machine.events.reject)            
              didHandleExecute = ++count
              return event
            }
          },
        },
        leave: ({ event, from: { state: from }, to: { state: to } }) => {
          didLeaveIdle = ++count
          console.log(`leaving ${from} to ${event} to ${to}`)
        }
      },
      Pending: {
        enter: (e) => {
          didEnterPending = ++count
          console.log('entering Pending via', e.event, e.params)
        },
        on: {
          resolve: {
            before: () => {
              didBeforeResolve = ++count
              console.log('In Pending before resolve')
            },
            after: () => {
              didAfterResolve = ++count
              console.log('Resolved from Pending')
            }
          }
        }
      }
      
    });
    expect(didBeforeExecute).toBeFalsy()
    expect(didGuardReject).toBeFalsy()
    machine.events.execute(1);
    expect(didGuardReject).toBeTruthy
    expect(didBeforeExecute).toBeFalsy()
    
    expectState("Idle");

    expect(didGuardAccept).toBeFalsy()
    machine.events.execute(100);
    expect(didGuardAccept).toBeTruthy
    const pendingState = machine.getState();
    expect(pendingState.state).toBe("Pending");

    expect(didBeforeResolve).toBeFalsy()
    await delay(100);
    expect(didBeforeResolve).toBeTruthy

    const resolvedState = machine.getState();
    expect(resolvedState.state).toBe("Resolved");
    expect(resolvedState.data).toBe(100);

    console.log('removing lifecycle')
    removeLifecycle()
    machine.reset()
    console.log('resetting')
    const resetState = machine.getState();
    expect(resetState.state).toBe("Idle");

    console.log('executing manually without lifecycle')
    // without lifecycle, there is no delay implementation
    machine.events.execute(1000)
    expectState("Pending");
    
    machine.events.resolve(1)
    const resolvedState2 = machine.getState();
    expect(resolvedState2.state).toBe("Resolved");
    expect(resolvedState2.data).toBe(1);

    expect(didGuardReject).toBe(1)
    expect(didGuardAccept).toBe(2)
    expect(didHandleExecute).toBe(3)
    expect(didLeaveIdle).toBe(4)
    expect(didBeforeExecute).toBe(5)
    expect(didEnterPending).toBe(6)
    expect(didBeforeResolve).toBe(7)
    expect(didAfterResolve).toBe(8)
  });
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delayed<T>(ms: number, data: T) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(data), ms));
}