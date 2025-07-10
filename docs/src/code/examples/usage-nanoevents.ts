import { createFactoryMachine, defineStates, notify, setup } from "matchina";
// import { createNanoEvents } from "nanoevents";

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

// const it = createNanoEvents<{
//   [event: string]: (ev: ReturnType<typeof m4.getChange>) => void;
// }>();
// setup(m4)(
//   (m) => {
//     Object.assign(m, {
//       emit: it.emit.bind(it),
//       subscribe: it.on.bind(it),
//     });
//     return () => {
//       const target = m as any;
//       delete target.emit;
//       delete target.subscribe;
//     };
//   },
//   notify((m4 as any).emit),
// );

m4.getChange().to.key = "Pending";
