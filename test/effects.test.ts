import { describe, expect, it } from "vitest";
import { createEffects, runEffectsOnUpdate } from "../src/effects";
import { defineMachine } from "../src/machine";
import { createStates } from "../src/states";

const effectsConfig = {
  Notify: (msg: string) => ({ msg }),
} as const;

const makeEffects = () => createEffects(effectsConfig);
// type Effects = ReturnType<typeof makeEffects>;
const makeStates = (effects = makeEffects()) => {
  return createStates({
    Idle: undefined,
    Pending: { effects: undefined },
    Done: () => ({ effects: [effects.Notify(`Done at ${Date.now()}`)] }),
  });
};
// type State = UnionFactoryMember<ReturnType<typeof makeStates>>;

const makeMachine = (states = makeStates()) =>
  defineMachine(states, {
    Idle: { next: "Pending" },
    Pending: { next: "Done" },
    Done: {},
  }).create(states.Idle());

function makeMachineWithEffects() {
  const machine = makeMachine();
  runEffectsOnUpdate(
    machine,
    (state) => {
      // console.log("state", state);
      return (state.data as any)?.effects;
    },
    effectHandlers,
  );
  return machine;
}

const effectHandlers = {
  Notify: (m: unknown) => console.log("NOTIFY", m), // fix unknown
  _: () => {
    console.log("stub");
  },
} as const;

describe("createEffects", () => {
  it("should create an effects union with the correct members", () => {
    const effects = makeEffects();
    expect(Object.keys(effects)).toEqual(Object.keys(effectsConfig));
  });
});

describe("runEffectsOnUpdate", () => {
  it("should handle effects when the state changes", () => {
    const machine = makeMachineWithEffects();
    machine.events.next();
    // console.log(machine.getState());
    machine.events.next();
    // console.log(machine.getState());
    // expect(states.Notify).toHaveBeenCalled();
  });

  it("should not handle effects when the state does not change", () => {
    const machine = makeMachineWithEffects();
    machine.events.next();
    // expect(states.Notify).not.toHaveBeenCalled();
  });
});
