import {
  bindEffects,
  createMachine,
  defineEffects,
  defineStates,
  addEventApi,
} from "matchina";

const myEffects = defineEffects({
  LoadRemote: undefined,
  SaveRemote: undefined,
  Notify: (msg: string) => ({ msg }),
});

const states = defineStates({
  Idle: () => ({ effects: [myEffects.LoadRemote()] }),
  Pending: () => ({ effects: [myEffects.SaveRemote()] }),
  Done: () => ({ effects: [myEffects.Notify("all done!")] }),
});

const machine = addEventApi(
  createMachine(
    states,
    {
      Idle: { next: "Pending" },
      Pending: { next: "Done" },
      Done: {},
    },
    "Idle"
  )
);

bindEffects(machine, (state) => state.data.effects as any, {
  Notify: (m) => console.log("NOTIFY", m),
});

const checkState = () =>
  console.log({
    state: machine.getState().key,
    effects: machine.getState().data.effects.map(({ effect }: any) => effect),
  });
checkState();
machine.api.next();
checkState();
machine.api.next();
checkState();
machine.api.next();
checkState();
