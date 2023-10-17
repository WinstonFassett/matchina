import { expect, it, describe, beforeEach } from "vitest";
import { UnionizedStates, createStates } from "../src/states";
import { defineMachine } from "../src/machine";
import { UnionFactory } from "../src/unionize";
import { MachineDefinition } from "../src/machine-types";

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
      Initial: undefined;
      Done: undefined;
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
    states = createStates({ Initial: undefined, Done: undefined });
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
  describe("update()", () => {
    describe("updater", () => {
      it("receives current event as context", () => {
        machine.update((context) => {
          const { getLast: event } = machine;
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
      const res = machine.transition('InvalidEvent' as any, {})
      expect(res).toBe(machine.getLast())
    });
  });
  describe("send", () => {
    it("invoke send", () => {});
  });
  describe("events", () => {
    it("invoke send", () => {});
  });
});
