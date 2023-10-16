import { createStates } from "../src/states";
import { createMachine } from "../src/machine";
import { createEffects, runEffectsOnUpdate } from "../src/effects";

const myEffects = createEffects({
  LoadRemote: undefined,
  SaveRemote: undefined,
  Notify: (msg: string) => ({ msg }),
});

const states = createStates({
  Idle: () => ({ effects: [myEffects.LoadRemote()] }),
  Pending: () => ({ effects: [myEffects.SaveRemote()] }),
  Done: () => ({ effects: [myEffects.Notify("all done!")] }),
});

const machine = createMachine(states, {
  Idle: { next: "Pending" },
  Pending: { next: "Done" },
  Done: {},
});

runEffectsOnUpdate(machine as any, {
  Notify: console.log,
  _: (ev: any) => {
    console.log("unhandled", ev);
  },
});
