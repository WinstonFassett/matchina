import { delayed } from "../test/delay";
import { onLifecycle } from "../src/extras/lifecycle";
import { createPromiseMachine } from "../src/extras/promise";

async function promiseLifecycleUsage () {
  // promise machine WITHOUT a promise to drive it
  const machine = createPromiseMachine<number, number>();
  const removeLifecycle = onLifecycle(machine, {
    Idle: {
      on: {
        execute: {
          guard ({ type: event, params, from: { name: from }, to: { name: to } }) {
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
      leave: ({ type: event, from: { name: from }, to: { name: to } }) => {
        console.log(`leaving ${from} to ${event} to ${to}`)
      }
    },
  });
  const checkState = () => console.log(machine.getState().name)
  console.log('execute 1')
  machine.events.execute(1);
  console.log('execute 1000')
  machine.events.execute(1000);
  checkState()
  await machine.done
  checkState()

  console.log('removing lifecycle')
  removeLifecycle()
  machine.reset()
  console.log('resetting')
  checkState()

  // without lifecycle, there is no delay implementation
  machine.events.execute(1000)
  // state is pending
  checkState()
  // synchronously resolve
  machine.events.resolve(1)
  checkState()
}

await promiseLifecycleUsage()
