import {
  createMachine,
  defineStates,
  enter,
  guard,
  leave,
  setup,
} from "matchina";

// ---cut---
const states = defineStates({
  Idle: undefined,
  Pending: (x: number) => ({ s: `#${x}` }),
  Resolved: (ok: boolean) => ({ ok }),
  Rejected: (err: Error) => ({ err }),
});

const m4 = createMachine(
  states,
  {
    Idle: { execute: "Pending" },
    Pending: { resolve: "Resolved", reject: "Rejected" },
    Resolved: {},
    Rejected: {},
  },
  "Idle",
);
m4.getChange().to.key = "Pending";

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
);

m4.send("execute", 1);
