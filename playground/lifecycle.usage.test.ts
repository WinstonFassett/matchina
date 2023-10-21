import { expect, it, describe } from "vitest";
import { createPromiseMachine } from "../src/promise";
import { onLifecycle } from "../src/lifecycle";

describe("onLifecycle", () => {
  
  it("should call hooks with lifecycle", async () => {
    const machine = createPromiseMachine<number, number>(async (num) => {
      await delay(num);
      return num;
    });

    const initialState = machine.getState();
    expect(initialState.state).toBe("Idle");

    const removeLifecycle = onLifecycle(machine, {
      Idle: {
        on: {
          execute: {
            guard ({ event, params, from: { state: from }, to: { state: to } }) {
              console.log(`${from} wants to ${event} to ${to} with params ${params.join(', ')}`)
              const accept = params[0] > 1
              console.log('GUARD accept?', accept)
              return accept            
            },
            before ({ params: [amount] }) {
              console.log('executing', amount)
            },
            handle: (event) => {
              const num = event.params[0]
              machine.promise = delayed(num, num)
              machine.done = machine.promise
                .then(machine.events.resolve)
                .catch(machine.events.reject)            
              return event
            }
          },
        },
        leave: ({ event, from: { state: from }, to: { state: to } }) => {
          console.log(`leaving ${from} to ${event} to ${to}`)
        }
      },
      Pending: {
        enter: (e) => {
          console.log('entering Pending via', e.event, e.params)
        },
        on: {
          resolve: {
            before: () => {
              console.log('In Pending before resolve')
            },
            after: () => {
              console.log('Resolved from Pending')
            }
          }
        }
      }
      
    });

    machine.events.execute(1);
    const idleState = machine.getState();
    expect(idleState.state).toBe("Idle");

    machine.events.execute(100);
    const pendingState = machine.getState();
    expect(pendingState.state).toBe("Pending");

    // Use setTimeout with a very short delay to wait for asynchronous operations to complete
    await delay(100);

    const resolvedState = machine.getState();
    expect(resolvedState.state).toBe("Resolved");
    expect(resolvedState.data).toBe(100);

    console.log('removing lifecycle')
    removeLifecycle()
    machine.reset()
    console.log('resetting')
    const resetState = machine.getState();
    expect(resetState.state).toBe("Idle");

    // without lifecycle, there is no delay implementation
    machine.events.execute(1000)
    // state is pending
    const pendingState2 = machine.getState();
    expect(pendingState2.state).toBe("Pending");
    // synchronously resolve
    machine.events.resolve(1)
    const resolvedState2 = machine.getState();
    expect(resolvedState2.state).toBe("Resolved");
    expect(resolvedState2.data).toBe(1);
  });
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delayed<T>(ms: number, data: T) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(data), ms));
}