import { describe, expect, it } from "vitest";
import { defineMachine } from "../src/machine";
import { defineStates } from "../src/states";
import { withEvents } from "../src/extras/with-events";

const makeStates = () =>
  defineStates({
    Initial: { key: "initial" },
    Done: (ok: boolean, msg?: string) => ({ ok, msg }),
  });
const makeMachine = () => {
  const states = makeStates();
  return withEvents(
    defineMachine(states, {
      Initial: {
        done: "Done",
        doneFunc: (done: number) =>
          states[done === 100 ? "Done" : "Initial"](true),
        doneAdvFunc: (done: string) => (_, event, def) => {
          return states[done === "DONE" ? "Done" : "Initial"](
            event === "doneAdvFunc",
          );
        },
      },
      Done: {},
    }).create("Initial"),
  );
};

describe("defineMachine", () => {
  it("exposes its states and transitions", () => {
    const states = defineStates({});
    const transitions = {};
    const Machine = defineMachine(states, transitions);
    expect(Machine.states).toBe(states);
    expect(Machine.transitions).toBe(transitions);
  });
});

describe("machine instance", () => {
  it("exposes its config with initialState", () => {
    const states = defineStates({});
    const transitions = {};
    const machine = defineMachine(states, transitions).create(1 as never);
    expect(machine.context.initialState).toBe(1);
  });

  describe("states", () => {
    const machine = makeMachine();
    it("match with parameterized handlers", () => {
      expect(
        machine.context.states.Initial().match({
          Initial: () => 100,
          _: () => 0,
        }),
      ).toBe(100);

      expect(
        machine.context.states.Initial().match({
          _: () => 1,
        }),
      ).toBe(1);

      expect(() =>
        machine.context.states.Initial().match({
          InvalidKey: () => 1,
        } as any),
      ).toThrow();

      expect(
        machine.context.states.Done(true, "test message").match(
          {
            Done: (ok) => ok,
          },
          false,
        ),
      ).toStrictEqual({ ok: true, msg: "test message" });
    });
  });
  describe("update()", () => {
    describe("updater", () => {
      it("receives current event as context", () => {
        const machine = makeMachine();
        machine.update((context) => {
          const event = machine.getChange();
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
  // describe("getChange", () => {
  //   it("ignores invalid transitions", () => {
  //     const machine = makeMachine();
  //     const res = machine.getChange("InvalidEvent" as any, {});
  //     expect(res).toBe(machine.getLast());
  //   });
  // });
  describe("events transitioners", () => {
    it("handles string targets", () => {
      const machine = makeMachine();
      machine.event.done(true);
      expect(machine.getChange().to.key).toBe("Done");
    });
    it("handles function targets", () => {
      const machine = makeMachine();
      machine.event.doneFunc(100);
      expect(machine.getChange().to.key).toBe("Done");
    });
    it("handles advanced function targets", () => {
      const machine = makeMachine();
      // machine.event
      machine.event.doneAdvFunc("DONE");
      expect(machine.getChange().to.key).toBe("Done");
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
    machine.event.done(true);
    const mustBeOk = machine.getChange().match({
      done: (ok) => {
        console.log("ok?", ok);
        return "ok" as const;
      },
    });
    console.log({ mustBeOk });
    const mustBeThing = machine.getChange().match({
      _: () => {
        return "thing" as const;
      },
    });
    console.log({ mustBeThing });
  });
});
describe("enhancer", () => {
  let didEnhancerRun = false;
  it("should run before/around/after update", () => {
    const states = makeStates();
    const machine = defineMachine(states, {
      Initial: {
        done: "Done",
      },
      Done: {},
    }).create(states.Initial(), function (doUpdate, previous) {
      console.log("RUN ENHANCER");
      if (!previous) {
        console.log("SKIP");
      }
      // doUpdate(function (old){
      //   console.log('DOING UPDATE', arguments)
      //   return old
      // })
      doUpdate(previous);
      didEnhancerRun = true;
      console.log("BEFORE");
      // commit(updater);
      console.log("AFTER");
    });

    expect(didEnhancerRun).toBe(true);
    machine.send("done");
    expect(didEnhancerRun).toBe(true);
  });
});
