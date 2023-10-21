import { describe, expect, it } from "vitest";
import { createEffects, bindEffects } from "../src/extras/effects";
import { defineMachine } from "../src/machine";
import { defineStates } from "../src/states";

const effectsConfig = {
  Notify: (msg: string) => ({ msg }),
} as const;

const makeEffects = () => createEffects(effectsConfig);

const makeStates = (effects = makeEffects()) => {
  return defineStates({
    Idle: undefined,
    Pending: { effects: undefined },
    Done: () => ({ effects: [effects.Notify(`Done at ${Date.now()}`)] }),
  });
};

const makeMachine = (states = makeStates()) =>
  defineMachine(states, {
    Idle: { next: "Pending" },
    Pending: { next: "Done" },
    Done: {},
  }).create(states.Idle());

describe("createEffects", () => {
  it("should create an effects union with the correct members", () => {
    const effects = makeEffects();
    expect(Object.keys(effects)).toEqual(Object.keys(effectsConfig));
  });
});

describe("runEffectsOnUpdate", () => {
  it("should handle effects when the state changes", () => {
    let didNotify = false;
    const machine = makeMachine();
    bindEffects(machine, (state) => (state.data as any)?.effects, {
      Notify: (m) => {
        didNotify = !!m;
        // console.log("NOTIFY", m)
      },
    });
    machine.events.next();
    expect(didNotify).toBe(false);
    // console.log(machine.getState());
    machine.events.next();
    // console.log(machine.getState());
    expect(didNotify).toBe(true);
    // expect(states.Notify).toHaveBeenCalled();
  });

  it("should not invoke effects when the state does not change", () => {
    let didNotify = false;
    const machine = makeMachine();
    bindEffects(machine, (state) => (state.data as any)?.effects, {
      Notify: (m) => {
        didNotify = !!m;
        // console.log("NOTIFY", m)
      },
    });
    expect(didNotify).toBe(false);
    machine.events.next();
    machine.events.next();
    expect(didNotify).toBe(true);
    didNotify = false;
    machine.events.next();
    // console.log(machine.getState());
    expect(didNotify).toBe(false);
  });
});
