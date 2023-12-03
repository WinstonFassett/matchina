import { createNanoEvents } from "nanoevents";
import { setup } from "../../ext/setup";
import { createFactoryMachine } from "../../factory-machine";
import { enter, guard, leave, notify } from "../../machine-setup";
import { defineStates } from "../../states";

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
  "Idle",
);
m4.getChange().to;

setup(m4)(
  guard((ev) => ev.type !== "execute" || ev.params[0] > 0),
  leave((ev) => {
    if (ev.type == "execute") {
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
);

m4.send("execute", 1);

const it = createNanoEvents();

setup(m4)(
  (m) => {
    Object.assign(m, {
      emit: (v) => it.emit(v),
      subscribe: (t, l) => it.on(t, l),
    });
    return () => {
      const target = m as any;
      delete target.emit;
      delete target.subscribe;
    };
  },
  notify((m4 as any).emit),
);
