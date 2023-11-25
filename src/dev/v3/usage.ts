import { defineStates } from "../../states";
import { createFactoryMachine } from "./factory-machine";
import {
  after,
  before,
  effect,
  guard,
  handle,
  machineSetup,
  notify,
  setupMachine,
  when,
} from "./machine-setup";
import { createStateMachine } from "./state-machine";
import { nanosubscriber } from "../../extras/nanosubscriber";
import { listenTo } from "./registrants";
import { createApi, withApi } from "./factory-event-api";
import { condition } from "./method";
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

when((ev) => ev.type === "start", (ev) => (ev) => {})(m1)
// m1.send('start')

setupMachine(m1)(
  guard((ev) => true),
  before((ev) => console.log("before", ev)),
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

machineSetup<typeof m2>(
  guard((ev) => true),
  before((ev) => console.log("before", ev)),
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
m4.getChange().to;
m4.send('execute', 1)

setupMachine(m4)(
  guard((ev) => ev.type !== "execute" || ev.params[0] > 0),
  before((ev) => {
    if (ev.type == "execute") {
      console.log("executing");
    }    
  }),
  after((ev) =>
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
    return ev
  }),
  when((ev) => ev.type === "execute", (ev) => {
    console.log('before execute')
    return (ev) => {
      console.log('after execute')
    }
  }),
  effect(condition((ev) => ev.type === "execute", ev => {
    ev
  })),
  after(
    condition(ev => ev.type == 'execute', ev => {
      console.log('entered condition')
      return ev => {
        console.log('exited condition')
      }
    })
  )
);
const unwhen = when(ev=> ev.to.key == 'Idle', (ev) => {
  unwhen()
})(m4)

// when(ev => true, ev => {
//   console.log('enter', ev)
//   return ev => {
//     console.log('exit', ev)
//   }
// }),



m4.send("execute", 1);

listenTo(m4)("click", (ev) => {});

function withNanoSubscribe<T>(target: T & Partial<{ subscribe: any }>) {
  if (target.subscribe) return target;
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