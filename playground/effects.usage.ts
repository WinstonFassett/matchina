import { createStates } from "../src/states";
import { defineMachine } from "../src/machine";
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

const machine = defineMachine(states, {
  Idle: { next: "Pending" },
  Pending: { next: "Done" },
  Done: {},
}).create(states.Idle());

runEffectsOnUpdate(machine as any, {
  Notify: m => console.log('NOTIFY', m),
  _: (ev: any) => {
    console.log("stub");
  },
});


const checkState = () => console.log({ state: machine.getState().state, effects: machine.getState().data.effects.map(({ effect }) => effect) })
checkState()
machine.events.next()
checkState()
machine.events.next()
checkState()
machine.events.next()
checkState()