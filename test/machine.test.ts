import { describe, expect, it } from "vitest";
import { defineMachine } from "../src/machine";
import { createStates } from "../src/states";

const makeStates = () =>
  createStates({
    Initial: { name: "initial" },
    Done: (ok: boolean) => ({ ok }),
  });
const makeMachine = () => {
  const states = makeStates();
  return defineMachine(states, {
    Initial: {
      done: "Done",
      doneFunc: (done: number) =>
        states[done === 100 ? "Done" : "Initial"](true),
      doneAdvFunc: (done: string) => (event, machine) => {
        return machine.states[done === "DONE" ? "Done" : "Initial"](
          event === "doneAdvFunc",
        );
      },
    },
    Done: {},
  }).create(states.Initial());
};

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
  it("exposes its states and transitions on its config", () => {
    const states = createStates({});
    const transitions = {};
    const machine = defineMachine(states, transitions).create(
      undefined as never,
    );
    expect(machine.config.states).toBe(states);
    expect(machine.config.transitions).toBe(transitions);
  });

  describe("states", () => {
    const machine = makeMachine();
    it("can match", () => {
      expect(
        machine.states.Initial().match({
          Initial: () => 100,
          _: () => 0,
        }),
      ).toBe(100);

      expect(
        machine.states.Initial().match({
          _: () => 1,
        }),
      ).toBe(1);

      expect(() =>
        machine.states.Initial().match({
          InvalidKey: () => 1,
        } as any),
      ).toThrow();
    });
  });
  describe("update()", () => {
    describe("updater", () => {
      it("receives current event as context", () => {
        const machine = makeMachine();
        machine.update((context) => {
          const event = machine.getLast();
          expect(context.from).toEqual(event.from);
          return context;
        });
      });
      it("returns new context", () => {
        const machine = makeMachine();
        machine.update((context) => {
          return context;
        });
      });
      it("new context may update state", () => {
        const machine = makeMachine();
        machine.update((context) => {
          return context;
        });
      });
    });
  });
  describe("transition", () => {
    it("ignores invalid transitions", () => {
      const machine = makeMachine();
      const res = machine.transition("InvalidEvent" as any, {});
      expect(res).toBe(machine.getLast());
    });
  });
  describe("events transitioners", () => {
    it("handles string targets", () => {
      const machine = makeMachine();
      machine.events.done(true);
      expect(machine.getLast().to.state).toBe("Done");
    });
    it("handles function targets", () => {
      const machine = makeMachine();
      machine.events.doneFunc(100);
      expect(machine.getLast().to.state).toBe("Done");
    });
    it("handles advanced function targets", () => {
      const machine = makeMachine();
      machine.events.doneAdvFunc("DONE");
      expect(machine.getLast().to.state).toBe("Done");
    });
  });
  describe("send", () => {
    it("invoke send", () => {});
  });
  describe("events", () => {
    it("invoke send", () => {});
  });
  it("events can match", () => {
    const machine = makeMachine();
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
