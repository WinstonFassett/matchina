import { createSetup, setup } from "./ext/setup";
import { EntryListener, when } from "./extras/when";
import { withNanoSubscribe } from "./extras/with-nanosubscribe";
import { createApi } from "./factory-event-api";
import { FactoryMachineEvent, createFactoryMachine } from "./factory-machine";
import { leftState, onLeftState, whenEvent } from "./factory-machine-hooks";
import {
  effect,
  enter,
  guard,
  handle,
  leave,
  notify,
  onNotify,
} from "./machine-hooks";
import { matchesChangeEventKeys, matchesPropertyFilters } from "./match-property-filters";
import { StateMachineEvent, createStateMachine } from "./state-machine";
import { defineStates } from "./states";

const m1 = createStateMachine<
  StateMachineEvent &
    (
      | { type: "start"; params: [nickname: "Bob" | "Pat"] }
      | { type: "stop"; params: [{ forever: boolean }] }
    )
>(
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

m1.send("start", "Bob");
m1.send("stop", { forever: true });

const whenStart = <E extends StateMachineEvent>(fn: EntryListener<E>) =>
  when((ev) => ev.type === "start", fn);

setup(m1)(
  guard((ev) => ev.type === "start"),
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

// const isChange =
//   <E extends KeyedChangeEvent>(filter: KeyedChangeEventFilter<E>) =>
//   (ev: E) =>
//     matchesChangeEventKeys(ev, filter);

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
  // enter(
  //   when(isChange({ type: "execute" }), (ev) => {
  //     console.log("entered condition");
  //     return (ev) => {
  //       console.log("exited condition");
  //     };
  //   }),
  // ),
  notify(
    when(
      (ev) => ev.type === "reject",
      // eslint-disable-next-line unicorn/consistent-function-scoping
      (ev) => (ev) => {},
    ),
  ),
  notify(
    when(
      (ev) => ev.type === "execute",
      (ev) => {
        console.log("entered execute state", ev.to.key);
        return (ev) => {
          console.log("exited execute state");
        };
      },
    ),
  ),
);

m4.send("execute", 1);

onNotify(m4, (ev) => {
  console.log("notify", ev);
});

onNotify(
  m4,
  when(
    (ev) => ev.type === "execute",
    (ev) => {
      console.log(ev.to.as("Pending"));
    },
  ),
);

const api = createApi(m4);

api.execute(1);
api.reject(new Error("nope"));

const unsub = notify((ev) => console.log(ev))(m4);

const m5 = withNanoSubscribe(m4); // .subscribe(ev => {})
type EE = ReturnType<typeof m5.getChange>;

type X = FactoryMachineEvent<typeof m4>
const x = {} as X

if (matchesPropertyFilters(x, {
  type: 'execute'
})){
  // x.type = 'execute'
  x.type = 'reject'
}

// const e = {} as ReturnType<typeof m4.getChange>;
const e = {} as FactoryMachineEvent<typeof m4>

if (matchesChangeEventKeys(e, { from: 'Idle' } as const)) {
  // e.type = "execute";
  // e.from.key = "Idle";
  
}
if (matchesChangeEventKeys(e, { type: 'reject' } as const)) {
  e
  // e.from.key = "Pending";
  // e.type = "reject";
  // e.to.key = "Rejected";
  // e.to.data.err.message = "nope";
}

// if (matchesChangeEventKeys(e, 'execute')) {}
// if (matchesChangeEventKeys(e, 'execute', 'Idle', 'Pending')) {
//   e.type = 'execute'
// }

if (matchesChangeEventKeys(e, {  type: 'execute' } as const)) {
  e.to.key = "Pending";
}

if (matchesChangeEventKeys(e, { to: 'Pending', from: 'Idle'} as const)) {
  e.to.key = 'Pending';
}

if (matchesChangeEventKeys(e, { from: "Pending", to: "Rejected" } as const)) {
  e.type = "reject";
}

// if (matchesChangeEventKeys(e, 'reject', 'Pending', 'Rejected')){

// }

if (matchesChangeEventKeys(e, {
  to: 'Rejected',
  // type: 'execute'
} as const)) {
  // e.to.data.err.message = "nope";
  e.type = 'reject'
}

if (
  matchesChangeEventKeys(e, {
    from: "Pending",
    type: "reject",
  } as const)
) {
  e.params[0].message = "nope";
  e.to.data.err.message = "nope";
}

// if (isFactoryMachineChangeFromTypeTo(e, "Pending", "reject")) {
//   e.to.key = "Rejected";
// }

// if (isFactoryMachineChangeFromTypeTo(e, "Pending", "reject")) {
//   // e.from.key = 'Rejected'
//   e.type = "reject";
//   e.to.key = "Rejected";
//   e.to.data.err.message = "nope";
// }

// if (isFactoryMachineChangeFromTypeTo(e, "Idle", "execute")) {
//   e.type = "execute";
// }

// if (isFactoryMachineChangeFromTypeTo(e, "Idle", "execute", "Pending")) {
//   e.type = "execute";
// }

// if (
//   isFactoryMachineChangeFromTypeTo(e, undefined as any, undefined, "Resolved")
// ) {
//   e.from.key = "Pending";
//   e.to.key = "Resolved";
//   e.type = "resolve";
// }


console.log(
  e.match({
    reject: err => err.message,
    resolve: ok => ok.toString(),
    execute: x => x.toString()
  })
)

m5.subscribe(
  when(
    (ev) => ev.type === "execute",
    (ev1) => (ev2) => {
      console.log("in", ev1, "out", ev2);
    },
  ),
);

m5.subscribe(
  whenEvent({ from: "Pending", type: "reject" }, (ev) => {
    ev.type = "reject";
    ev.to.key = "Rejected";
  }),
);

m5.subscribe(
  whenEvent({ from: "Pending", type: "reject", to: "Rejected" }, (ev) => {
    ev.type = "reject";
    ev.from.key = "Pending";
    ev.to.key = "Rejected";
    ev.to.data.err.message = "nope";
  }),
);

setup(m4)(notify(leftState('Pending', (ev) => {})));

const unsub2 = m5.subscribe(
  when(
    (x) => true,
    (x) => {
      console.log("enter");
      return (x) => {
        console.log("exit", x.to.key);
        unsub2();
      };
    },
  ),
);

onLeftState(m4, "Pending", (ev) => {
  ev.from.key = "Pending";
  ev.type = "execute";
  // ev.to.key = 'Resolved'
});
