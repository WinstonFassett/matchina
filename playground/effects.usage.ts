import { defineStates } from "../src/states";
import { defineMachine } from "../src/machine";
import { createEffects, bindEffects } from "../src/extras/effects";

const myEffects = createEffects({
  LoadRemote: undefined,
  SaveRemote: undefined,
  Notify: (msg: string) => ({ msg }),
});

const states = defineStates({
  Idle: () => ({ effects: [myEffects.LoadRemote()] }),
  Pending: () => ({ effects: [myEffects.SaveRemote()] }),
  Done: () => ({ effects: [myEffects.Notify("all done!")] }),
});

const machine = defineMachine(states, {
  Idle: { next: "Pending" },
  Pending: { next: "Done" },
  Done: {},
}).create(states.Idle());

bindEffects(machine, 
  state => state.data.effects,
  {
  Notify: m => console.log('NOTIFY', m),
  _: () => {
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