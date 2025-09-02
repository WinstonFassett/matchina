import { describe, expect, it } from "vitest";
import { addEventApi, createMachine } from "../src";
import { defineStates } from "../src/define-states";
import { bindEffects } from "../src/extras/bind-effects";
import { defineEffects } from "../src/extras/effects";

const effectsConfig = {
  Notify: (msg: string) => ({ msg }),
} as const;

const makeEffects = () => defineEffects(effectsConfig);

const makeStates = (effects = makeEffects()) => {
  return defineStates({
    Idle: undefined,
    Pending: () => ({ effects: undefined }),
    Done: () => ({ effects: [effects.Notify(`Done at ${Date.now()}`)] }),
  });
};

const makeMachine = (
  states = makeStates(),
  initialize: (s: typeof states) => ReturnType<typeof states[keyof typeof states]> = (s) => s.Idle()
) =>
  addEventApi(
    createMachine(
      states,
      {
        Idle: { next: "Pending" },
        Pending: { next: "Done" },
        Done: {},
      },
      initialize(states)
    )
  );

describe("defineEffects", () => {
  it("should create an effects union with the correct members", () => {
    const effects = makeEffects();
    effects.Notify("test").match({
      Notify: (msg) => {},
    });
    expect(Object.keys(effects)).toEqual(Object.keys(effectsConfig));
  });
});

describe("bindEffects", () => {
  it("should handle effects when the state changes", () => {
    let didNotify = false;
    const machine = makeMachine();
    bindEffects(machine, (state) => state.data.effects, {
      Notify: (m) => {
        didNotify = !!m;
      },
    });

    machine.api.next();
    expect(didNotify).toBe(false);
    machine.api.next();
    expect(didNotify).toBe(true);
  });

  it("should not invoke effects when the state does not change", () => {
    let didNotify = false;
    const machine = makeMachine();
    bindEffects(machine, (state) => state.data.effects, {
      Notify: (m) => {
        didNotify = !!m;
      },
    });
    expect(didNotify).toBe(false);
    machine.api.next();
    machine.api.next();
    expect(didNotify).toBe(true);
    didNotify = false;
    machine.api.next();
    expect(didNotify).toBe(false);
  });
  it("non-exhaustive (by default) should not throw when effect not matched", () => {
    const machine = makeMachine(makeStates(), (s) => s.Pending());
    bindEffects(machine, (state) => state.data?.effects, {}, false);
    expect(() => machine.api.next()).not.toThrow();
  });
  it("exhaustive should throw when effect not matched", () => {
    const machine = makeMachine(makeStates(), (s) => s.Pending());

    bindEffects(machine, (state) => state.data?.effects, {}, true);
    expect(() => machine.api.next()).toThrowErrorMatchingInlineSnapshot(
      `"Match did not handle key: 'Notify'"`
    );
  });
  it("_ should match all unmatched effects regardless of whether match is exhaustive", () => {
    const machine = makeMachine(makeStates(), (s) => s.Pending());
    let didNotify = false;
    bindEffects(machine, (state) => state.data?.effects, {
      _: () => {
        didNotify = true;
      },
    });
    machine.api.next();
    expect(didNotify).toBe(true);
  });
});
