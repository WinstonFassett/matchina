import { nanosubscriber } from "./extras/nanosubscriber";
import { defineStates } from "./states";
import { createApi } from "./factory-event-api";
import { createFactoryMachine } from "./factory-machine";
import { effect, enter, guard, handle, leave, notify } from "./machine-setup";
import { condition } from "./extras/condition";
import { when } from "./extras/when";
import { createSetup, setup } from "./ext/setup";
import { createStateMachine } from "./state-machine";
import { ChangeCommandEvent } from "./types";
import { KeyedChangeEventFilter, isKeyedChangeEvent } from "./typeguards";
const m1 = createStateMachine(
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

// m1.send('start')

const whenChange = 
  <E extends ChangeCommandEvent>(filter: KeyedChangeEventFilter<E>) => when(
    (ev: E) => isKeyedChangeEvent(ev, filter)
  );

const whenStart = whenChange({ type: "start" });

setup(m1)(
  guard((ev) => true),
  leave((ev) => console.log("before", ev)),
  notify(
    condition(
      (ev) => ev.type === "start",
      // eslint-disable-next-line unicorn/consistent-function-scoping
      (ev) => (ev) => {},
    ),
  ),
  notify(whenStart(ev => {
    console.log('entered start state')
    return (ev) => {
      console.log('exited start state')
    }
  })),  
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
  // when((ev) => ev.type === "execute", (ev) => {
  //   console.log('entered execute')
  //   return (ev) => {
  //     console.log('left execute')
  //   }
  // }),
  effect(
    condition(
      (ev) => ev.type === "execute",
      (ev) => {
        console.log({ ev });
      },
    ),
  ),
  enter(
    condition(
      (ev) => ev.type === "execute",
      (ev) => {
        console.log("entered condition");
        return (ev) => {
          console.log("exited condition");
        };
      },
    ),
  ),
);
// const unwhen = when(ev=> ev.to.key == 'Idle', (ev) => {
//   unwhen()
// })(m4)

// when(ev => true, ev => {
//   console.log('enter', ev)
//   return ev => {
//     console.log('exit', ev)
//   }
// }),

m4.send("execute", 1);

// listenTo(m4)("click", (ev) => {});

function withNanoSubscribe<T>(target: T & Partial<{ subscribe: any }>) {
  if (target.subscribe) {
    return target;
  }
  const [subscribe, emit, listeners] = nanosubscriber();
  return Object.assign(target, {
    subscribe,
    emit,
    listeners,
  });
}

const api = createApi(m4);
api.execute(1);
api.reject(new Error("nope"));

const unsub = notify((ev) => console.log(ev))(m4);

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
