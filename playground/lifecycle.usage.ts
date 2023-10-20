import { delay } from "../src/delay";
import { onLifecycle } from "../src/lifecycle";
import { createPromiseMachine } from "../src/promise";

async function promiseLifecycleUsage () {
  const somePromiseMachine = createPromiseMachine<any, number>();
  let done
  onLifecycle(somePromiseMachine, {
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
            somePromiseMachine.promise = delay(event.params[0])
            somePromiseMachine.done = somePromiseMachine.promise
              .then(somePromiseMachine.events.resolve)
              .catch(somePromiseMachine.events.reject)            
            return event
          }
        },
      },
      leave: ({ event, from: { state: from }, to: { state: to } }) => {
        console.log(`leaving ${from} to ${event} to ${to}`)
      }
    },
  });
  console.log(somePromiseMachine.getState().state)
  console.log('execute 1')
  somePromiseMachine.events.execute(1);
  console.log('execute 1000')
  somePromiseMachine.events.execute(1000);
  console.log(somePromiseMachine.getState().state)
  await done
  console.log(somePromiseMachine.getState().state)
}

await promiseLifecycleUsage()
