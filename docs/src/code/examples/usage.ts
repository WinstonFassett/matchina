import {
  createApi,
  createFactoryMachine,
  createSetup,
  createStateMachine,
  defineStates,
  effect,
  enter,
  guard,
  handle,
  leave,
  matchChange,
  matchFilters,
  notify,
  setupTransition as onChangeSetup,
  onLifecycle,
  onNotify,
  setup,
  change as setupChange,
  transition,
  when,
  withNanoSubscribe,
  type EntryListener,
  type StateMachineEvent,
} from "matchina";

const m1 = createStateMachine<
  StateMachineEvent<{ key: string; payload?: any }> &
    (
      | { type: "start"; params: [nickname: "Bob" | "Pat"] }
      | { type: "stop"; params: [{ forever: boolean }] }
    )
>(
  {
    Idle: {
      start: { key: "Running" },
    },
    Running: {
      stop: { key: "Idle" },
    },
  },
  { key: "Idle", payload: "whatever" },
);

m1.send("start", "Bob");
console.log("state", m1.getChange());
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
      start: { key: "Running" },
    },
    Running: {
      stop: { key: "Idle" },
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
//     isKeyedChangeEvent(ev, filter);

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
console.log("state", m4.getChange());
// api.reject(new Error("nope"));

const unsub = notify((ev) => console.log(ev))(m4);

const m5 = withNanoSubscribe(m4); // .subscribe(ev => {})
type EE = ReturnType<typeof m5.getChange>;

const x = m4.getChange();
if (
  matchFilters(x, {
    type: "execute",
  } as const)
) {
  // x.type = 'execute'
  x.type = "execute";
}

// const e = {} as ReturnType<typeof m4.getChange>;
const e = m4.getChange();

if (matchChange(e, { from: "Idle" } as const)) {
  // e.type = "execute";
  // e.from.key = "Idle";
}
if (matchChange(e, { type: "reject" } as const)) {
  console.log("MATCHED", e);
  // e.from.key = "Pending";
  // e.type = "reject";
  // e.to.key = "Rejected";
  // e.to.data.err.message = "nope";
}

// if (matchesChangeEventKeys(e, 'execute')) {}
// if (matchesChangeEventKeys(e, 'execute', 'Idle', 'Pending')) {
//   e.type = 'execute'
// }

if (matchChange(e, { type: "execute" } as const)) {
  e.to.key = "Pending";
}

if (matchChange(e, { to: "Pending", from: "Idle" } as const)) {
  e.to.key = "Pending";
}

if (matchChange(e, { from: "Pending", to: "Rejected" } as const)) {
  e.type = "reject";
}

// if (matchesChangeEventKeys(e, 'reject', 'Pending', 'Rejected')){

// }

if (
  matchChange(e, {
    to: "Rejected",
    // type: 'execute'
  } as const)
) {
  // e.to.data.err.message = "nope";
  e.type = "reject";
}

if (
  matchChange(e, {
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
console.log("MATCHING", e);
console.log(
  "Matched",
  e.match({
    reject: (err) => err.message,
    resolve: (ok) => ok.toString(),
    execute: (x) => x.toString(),
  }),
);

m5.subscribe(
  when(
    (ev) => ev.type === "execute",
    (ev1) => (ev2) => {
      console.log("in", ev1, "out", ev2);
    },
  ),
);

// m5.subscribe(
//   whenEvent({ from: "Pending", type: "reject" }, (ev) => {
//     ev.type = "reject";
//     ev.to.key = "Rejected";
//   }),
// );

// m5.subscribe(
//   whenEvent({ from: "Pending", type: "reject", to: "Rejected" }, (ev) => {
//     ev.type = "reject";
//     ev.from.key = "Pending";
//     ev.to.key = "Rejected";
//     ev.to.data.err.message = "nope";
//   }),
// );

// setup(m4)(notify(leftState("Pending", (ev) => {})));

// const unsub2 = m5.subscribe(
//   when(
//     (x) => true,
//     (x) => {
//       console.log("enter");
//       return (x) => {
//         console.log("exit", x.to.key);
//         unsub2();
//       };
//     },
//   ),
// );

// onLeftState(m4, "Pending", (ev) => {
//   ev.from.key = "Pending";
//   ev.type = "execute";
//   // ev.to.key = 'Resolved'
// });

setup(m4)(
  setupChange(
    { type: "execute" },
    (m) => {
      return () => {
        const e = m.getChange();
        e.from.key = "Idle";
      };
    },
    effect((ev) => {}),
    enter((ev) => {}),
    guard((ev) => true),
  ),
);
onChangeSetup(
  m4,
  { to: "Pending" },
  guard((ev) => true),
);
onChangeSetup(
  m4,
  { type: "execute" },
  guard((ev) => true),
);

setup(m4)(
  transition((ev, next) => {
    const done = setup(m4)();
    next(ev);
    done();
  }),
);

onLifecycle(m4, {
  "*": {
    on: {
      "*": {
        transition: (ev, next) => {
          const done = setup(m4)();
          next(ev);
          done();
        },
      },
    },
  },
});
