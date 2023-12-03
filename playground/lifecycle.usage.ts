import { delayed } from "../src/dev/v1/extras/delay";
import { onLifecycle } from "../src/dev/v1/extras/lifecycle";
import { createPromiseMachine } from "../src/dev/v1/extras/promise";
import { withEvents } from "../src/dev/v1/extras/with-events";

async function promiseLifecycleUsage () {
  // promise machine WITHOUT a promise to drive it
  const machine = withEvents(createPromiseMachine<number, [number]>());
  machine.event.execute(1);
  machine.event.reject(new Error("error"));
  // machine.promise = delayed(1, 1)
  const removeLifecycle = onLifecycle(machine, {
    Idle: {
      on: {
        execute: {
          guard ({ type: event, params, from: { key: from }, to: { key: to } }) {
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
            machine.done = (machine.promise as Promise<any>)
              .then(machine.event.resolve)
              .catch(machine.event.reject)            
            return event
          }
        },
      },
      leave: ({ type: event, from: { key: from }, to: { key: to } }) => {
        console.log(`leaving ${from} to ${event} to ${to}`)
      }
    },
  });
  const checkState = () => console.log(machine.getState().key)
  console.log('execute 1')
  machine.event.execute(1);
  console.log('execute 1000')
  machine.event.execute(1000);
  checkState()
  await machine.done
  checkState()

  console.log('removing lifecycle')
  // removeLifecycle()
  machine.reset()
  console.log('resetting')
  checkState()

  // without lifecycle, there is no delay implementation
  machine.event.execute(1000)
  // state is pending
  checkState()
  // synchronously resolve
  machine.event.resolve(1)
  checkState()
}

await promiseLifecycleUsage()
