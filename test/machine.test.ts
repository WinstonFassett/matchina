import { beforeEach, describe, expect, it } from "vitest";
import { defineMachine } from "../src/machine";
import { MachineDefinition } from "../src/types";
import { createStates } from "../src/states";
import { UnionFactory } from "../src/unionize";

describe("defineMachine", () => {
  it("exposes its states and transitions", () => {
    const states = createStates({});
    const transitions = {};
    const Machine = defineMachine(states, transitions);
    expect(Machine.states).toBe(states);
    expect(Machine.transitions).toBe(transitions);
  });
});

describe("machine instance", () => {
  let states: UnionFactory<
    {
      Initial: { name: "initial" };
      Done: (ok: boolean) => { ok: boolean };
    },
    "state"
  >;
  const transitions = {
    Initial: { done: "Done" },
    Done: {},
  } as const;
  let Machine: MachineDefinition<typeof states, typeof transitions>;
  let machine: ReturnType<(typeof Machine)["create"]>;
  beforeEach(() => {
    states = createStates({
      Initial: { name: "initial" },
      Done: (ok: boolean) => ({ ok }),
    });
    Machine = defineMachine(states, transitions);
    machine = Machine.create(states.Initial());
  });
  it("exposes its states and transitions on config", () => {
    const states = createStates({ Initial: undefined });
    const transitions = {
      Initial: {},
    };
    const Machine = defineMachine(states, transitions);
    expect(Machine.states).toBe(states);
    expect(Machine.transitions).toBe(transitions);
    const machine = Machine.create(states.Initial());
    expect(machine.config.states).toBe(states);
    expect(machine.config.transitions).toBe(transitions);
  });
  it("states can match", () => {
    expect(
      Machine.states.Initial().match({
        Initial: () => 100,
        _: () => 0,
      }),
    ).toBe(100);

    expect(
      Machine.states.Initial().match({
        _: () => 1,
      }),
    ).toBe(1);

    expect(() =>
      Machine.states.Initial().match({
        InvalidKey: () => 1,
      } as any),
    ).toThrow();
  });
  describe("update()", () => {
    describe("updater", () => {
      it("receives current event as context", () => {
        machine.update((context) => {
          const event = machine.getLast();
          expect(context.from).toEqual(event.from);
          return context;
        });
      });
      it("returns new context", () => {
        machine.update((context) => {
          return context;
        });
      });
      it("new context may update state", () => {
        machine.update((context) => {
          return context;
        });
      });
    });
  });
  describe("transition", () => {
    it("ignores invalid transitions", () => {
      const res = machine.transition("InvalidEvent" as any, {});
      expect(res).toBe(machine.getLast());
    });
  });
  describe("send", () => {
    it("invoke send", () => {});
  });
  describe("events", () => {
    it("invoke send", () => {});
  });
  it("events can match", () => {
    machine.events.done(true);
    const mustBeOk = machine.getLast().match({
      done: (ok) => {
        console.log("ok?", ok);
        return "ok" as const;
      },
    });
    console.log({ mustBeOk });
    const mustBeThing = machine.getLast().match({
      _: () => {
        return "thing" as const;
      },
    });
    console.log({ mustBeThing });
  });
});
