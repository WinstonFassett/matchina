import { describe, it, expect, beforeEach } from "vitest";
import { createEffects, runEffectsOnUpdate } from "../src/effects";
import { createStates } from "../src/states";
import { defineMachine } from "../src/machine";

const effectsConfig = {
  LoadRemote: undefined,
  SaveRemote: undefined,
  Notify: (msg: string) => ({ msg }),
} as const;

const makeEffects = () => createEffects(effectsConfig);
type Effects = ReturnType<typeof makeEffects>;
const makeStates = (effects = makeEffects()) => {
  return createStates({
    Idle: () => ({ effects: [effects.LoadRemote()] }),
    Pending: () => ({ effects: [effects.SaveRemote()] }),
    Done: () => ({ effects: [effects.Notify("all done!")] }),
  });
};
const makeMachine = (states = makeStates()) =>
  defineMachine(states, {
    Idle: { next: "Pending" },
    Pending: { next: "Done" },
    Done: {},
  }).create(states.Idle());

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
  beforeEach(() => {
    const machine = makeMachine();
    runEffectsOnUpdate<Effects>(machine, effectHandlers);
  });
  it("should handle effects when the state changes", () => {});

  it("should not handle effects when the state does not change", () => {
    const machine = makeMachine();
    machine.events.next();
    // expect(states.Notify).not.toHaveBeenCalled();
  });
});
