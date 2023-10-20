import { delay } from "../src/delay";
import { onLifecycle } from "../src/lifecycle";
import { defineMachine } from "../src/machine";
import { createPromiseMachine } from "../src/promise";
import { createStates } from "../src/states";

const Machine = defineMachine(
  createStates({
    Idle() {},
    Heating(to: number) { return {to} },
    Boiling(at: string) { return { at }},
  }),
  {
    Idle: {
      start: 'Heating'
    },
    Heating: {
      change: "Boiling",
    },
    Boiling: {},
  },
);
const machine = Machine.create(Machine.states.Idle());
let temp = 50

onLifecycle(machine, {
  Idle: {
    on: {
      start: {
        guard: (event) =>{   
          console.log('guard', event)
          const e = event.event
          const [a] = event.params
          event.to.data.to         
          return true
          // event.from.match({
          //   _() {
          //     return true;
          //   },
          // })
        },
        before(ev) {
          
        },
      },
    }
  },
  Heating: {
    on: {
      change: {
        guard (event) {
          const { to } = event.from.data
          const { at } = event.to.data
          const b = event.params
          return true
        }
      }
    }
  },
});



async function promiseLifecycleUsage () {
  const somePromiseMachine = createPromiseMachine<any, number>();
  let done
  onLifecycle(somePromiseMachine, {
    Idle: {
      on: {
        execute: {
          guard ({ event, params, from: { state: from }, to: { state: to }}) {
            console.log(`${from} wants to ${event} to ${to} with params ${params.join(', ')}`)
            const accept = params[0] > 1
            console.log('GUARD accept?', accept)
            return accept            
          },
          before ({ params: [amount]}) {
            console.log('executing', amount)
          },
          after: (event) => 
            done = delay(event.params[0])
              .then(somePromiseMachine.events.resolve)
              .catch(somePromiseMachine.events.reject),
        },
      },
      leave: ({ event, from: { state: from }, to: { state: to }}) => {
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

promiseLifecycleUsage()
