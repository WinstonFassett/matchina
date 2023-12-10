import { createSetup, setup } from "./ext/setup";
import { EntryListener, when } from "./extras/when";
import { createApi } from "./factory-event-api";
import { createFactoryMachine } from "./factory-machine";
import { leftState, onLeftState, whenEvent } from "./factory-machine-hooks";
import { effect, enter, guard, handle, leave, notify, onNotify } from "./machine-hooks";
import { StateMachineEvent, createStateMachine } from "./state-machine";
import { defineStates } from "./states";
import { AnyKeyedChangeEvent, KeyedChangeEventFilter, isFactoryMachineEvent, isKeyedChangeEvent } from "./typeguards";
import { withNanoSubscribe } from "./withNanoSubscribe";


const m1 = createStateMachine<StateMachineEvent & ({ type: 'start', params: [nickname: 'Bob'|'Pat'] } | { type: 'stop', params: [{forever: boolean}] })>(
  {
    Idle: {
      start: "Running",
    },
    Running: {
      stop: "Idle",
    },
  },
  { key: "Idle", data: undefined },
);

m1.send('start', 'Bob')
m1.send('stop', { forever: true})

const whenStart = <E extends StateMachineEvent>(fn: EntryListener<E>) => when((ev) => ev.type === "start", fn);

setup(m1)(
  guard((ev) => ev.type === 'start'),
  leave((ev) => console.log("before", ev)),
  
);

const m2 = createStateMachine(
  {
    Idle: {
      start: "Running",
    },
    Running: {
      stop: "Idle",
    },
  },
  { key: "Idle", data: undefined } as {
    key: "Idle" | "Pending" | "Done";
    data: undefined;
  },
);

createSetup<typeof m2>(
  guard((ev) => !!ev),
  leave((ev) => console.log("before", ev)),
)(m2);

const states = defineStates({
  Idle: undefined,
  Pending: (x: number) => ({ s: `#${x}` }),
  Resolved: (ok: boolean) => ({ ok }),
  Rejected: (err: Error) => ({ err }),
});

const m4 = createFactoryMachine(
  states,
  {
    Idle: { execute: "Pending" },
    Pending: { resolve: "Resolved", reject: "Rejected" },
    Resolved: {},
    Rejected: {},
  },
  states.Idle(),
);
// m4.getChange().to.key ;
m4.send("execute", 1);

const isChange =
  <E extends AnyKeyedChangeEvent>(
    filter: KeyedChangeEventFilter<any>
  ) => (ev: E) =>
    isKeyedChangeEvent<E>(filter, ev);



setup(m4)(
  guard((ev) => ev.type !== "execute" || ev.params[0] > 0),
  leave((ev) => {
    if (ev.type === "execute") {
      console.log("executing");
    }
  }),
  enter((ev) =>
    console.log(
      ev.to.match<any>({
        Pending: (ev) => ev.s,
        Resolved: (ev) => ev.ok,
        Rejected: (ev) => ev.err,
        _: () => false,
      }),
    ),
  ),
  handle((ev) => {
    return ev;
  }),
  effect(
    when(
      (ev) => ev.type === "execute",
      (ev) => {
        console.log({ ev });
      },
    ),
  ),
  enter(
    when(
      isChange({ type: 'execute'}),
      (ev) => {
        console.log("entered condition");
        return (ev) => {
          console.log("exited condition");
        };
      },
    ),
  ),
  notify(
    when(
      (ev) => ev.type === 'reject',
      // eslint-disable-next-line unicorn/consistent-function-scoping
      (ev) => (ev) => {},
    ),
  ),
  notify(
    when(ev => ev.type === 'execute', ev => {
      console.log('entered execute state', ev.to.key)
      return (ev) => {
        console.log('exited execute state')
      }    
    })
  )
);


m4.send("execute", 1);

onNotify(m4, ev => {
  console.log('notify', ev)
})

onNotify(m4, when(ev => ev.type === 'execute', ev => {
  console.log(ev.to.as('Pending'))
}))

const api = createApi(m4);

api.execute(1);
api.reject(new Error("nope"));

const unsub = notify((ev) => console.log(ev))(m4);

const m5 = withNanoSubscribe(m4) //.subscribe(ev => {})
type EE = ReturnType<typeof m5.getChange>

const e = {} as ReturnType<typeof m4.getChange>
if (isKeyedChangeEvent({ from: 'Idle', type: 'execute' }, e)) {
  e.type = 'execute'
  e.from.key = 'Idle'

}
if (isFactoryMachineEvent(e, { type: 'reject' } as const)) {
  e.from.key = 'Pending'
  e.type = 'reject'
  e.to.key = 'Rejected'
  e.to.data.err.message
}

if (isFactoryMachineEvent(e, { from: 'Pending' } as const)) {
  e.from.key = 'Pending'
}

if (isFactoryMachineEvent(e, { to: 'Resolved' } as const)) {
  e.to.key = 'Pending'
}


m5.subscribe(when(ev => ev.type === 'execute', ev => ev => {}))

m5.subscribe(whenEvent({ from: 'Idle', type: 'reject' }, ev => {
  ev.type = 'reject'
  ev.to.key = 'Idle'
}))

setup(m4)(
  notify(leftState('Rejected', ev => {

  }))
)


// const subscribeWhen = (filter: KeyedChangeEventFilter<any>, listener: EntryListener<EE>) =>
// m5.subscribe(when(
//   (ev) => isKeyedChangeEvent(ev``, filter),
//   listener as any
// ));

const unsub2 = m5.subscribe(
  when(x=>true, x=>{
    console.log('enter')
    return (x) => {
      console.log('exit', x.to.key)
      unsub2()
    }    
  })
)



onLeftState(m4, 'Pending', ev => {
  ev.from.key = 'Pending'
  ev.type = 'execute'
  // ev.to.key = 'Resolved'
})

// const onEnterState = (key: ReturnType<typeof m5.getState>['key'], listener: EntryListener<ReturnType<typeof m5.getChange>>) => subscribeWhen(
//   { to: key },
//   listener
// );

// onEnterState('Pending', ev => {
//   console.log('entered pending state')
//   return (ev) => {
//     console.log('left pending', ev.to.key)
//   }
// })

// add a global reset transition

// setup(m4)(
//   addTransitions('*', {
//     reset: 'Idle'
//   })
// )

// const m5 = withTransitions(m4, {
//   reset: 'Idle'
// })

// const onPhase = phased<ReturnType<typeof m4.getChange>>(m4);

// onPhase('guard', (ev, next) => {
//   if (ev.to.key === 'Pending') next(ev)
// })

// onPhase('handle', (ev, next) => {
//   if (ev.to.key === 'Pending') next(ev)
// })

// onPhase('exit', (ev, next) => {})

// listen<ReturnType<typeof m4.getChange>>()(m4)

// setup(m4)(
//   middlewareSetup({
//     guard: (ev, next) => {
//       if (ev.to.key === "Pending") next(ev);
//     },
//     handle: (ev, next) => {
//       if (ev.to.key === "Pending") next(ev);
//     },
//     update: (ev, next) => {}
//   }),
//   listenerSetup({
//     exit: [
//       condition((ev) => ev.to.key === "Pending", (ev) => {

//       })
//     ],
//     enter: [
//       (ev) => {

//       },
//     ],
//     effect: [
//       (ev) => {

//       },
//     ],
//   })
// )
