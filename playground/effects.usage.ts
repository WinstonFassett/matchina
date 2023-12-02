import { defineStates } from "../states";
import { defineMachine } from "../machine";
import { defineEffects, bindEffects } from "../extras/effects";
import { withEvents } from "../extras/with-events";

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

const machine = withEvents(
  defineMachine(states, {
    Idle: { next: "Pending" },
    Pending: { next: "Done" },
    Done: {},
  }).create(states.Idle()),
);

bindEffects(machine, (state) => state.data.effects as any, {
  Notify: (m) => console.log("NOTIFY", m),
});

const checkState = () =>
  console.log({
    state: machine.getState().key,
    effects: machine.getState().data.effects.map(({ effect }) => effect),
  });
checkState();
machine.event.next();
checkState();
machine.event.next();
checkState();
machine.event.next();
checkState();
