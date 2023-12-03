import { describe, expect, it } from "vitest";
import { defineEffects, bindEffects } from "../src/extras/effects";
import { defineMachine } from "../src/dev/v1/machine";
import { defineStates } from "../src/states";
import { withEvents } from "../src/dev/v1/extras/with-events";

const effectsConfig = {
  Notify: (msg: string) => ({ msg }),
} as const;

const makeEffects = () => defineEffects(effectsConfig);

const makeStates = (effects = makeEffects()) => {
  return defineStates({
    Idle: undefined,
    Pending: { effects: undefined },
    Done: () => ({ effects: [effects.Notify(`Done at ${Date.now()}`)] }),
  });
};

const makeMachine = (
  states = makeStates(),
  initialize = (s: typeof states) => s.Idle(),
) =>
  withEvents(
    defineMachine(states, {
      Idle: { next: "Pending" },
      Pending: { next: "Done" },
      Done: {},
    }).create(initialize(states)),
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

describe("runEffectsOnUpdate", () => {
  it("should handle effects when the state changes", () => {
    let didNotify = false;
    const machine = makeMachine();
    bindEffects(machine, (state) => (state.data as any)?.effects, {
      Notify: (m) => {
        didNotify = !!m;
      },
    });
    machine.event.next();
    expect(didNotify).toBe(false);
    machine.event.next();
    expect(didNotify).toBe(true);
  });

  it("should not invoke effects when the state does not change", () => {
    let didNotify = false;
    const machine = makeMachine();
    bindEffects(machine, (state) => (state.data as any)?.effects, {
      Notify: (m) => {
        didNotify = !!m;
      },
    });
    expect(didNotify).toBe(false);
    machine.event.next();
    machine.event.next();
    expect(didNotify).toBe(true);
    didNotify = false;
    machine.event.next();
    expect(didNotify).toBe(false);
  });
  it("non-exhaustive (by default) should not throw when effect not matched", () => {
    const machine = makeMachine(makeStates(), (s) => s.Pending() as any);
    bindEffects(machine, (state) => (state.data as any)?.effects, {}, false);
    expect(() => machine.event.next()).not.toThrow();
  });
  it("exhaustive should throw when effect not matched", () => {
    const machine = makeMachine(makeStates(), (s) => s.Pending() as any);
    bindEffects(machine, (state) => (state.data as any)?.effects, {}, true);
    expect(() => machine.event.next()).toThrowErrorMatchingInlineSnapshot(
      `"Match did not handle effect: 'Notify'"`,
    );
  });
  it("_ should match all unmatched effects regardless of whether match is exhaustive", () => {
    const machine = makeMachine(makeStates(), (s) => s.Pending() as any);
    let didNotify = false;
    bindEffects(machine, (state) => (state.data as any)?.effects, {
      _: () => {
        didNotify = true;
      },
    });
    machine.event.next();
    expect(didNotify).toBe(true);
  });
});
