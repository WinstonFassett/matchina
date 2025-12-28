import { describe, expect, it, vi } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine, addEventApi, pure, eventApi } from "../src";

const makeStates = () =>
  defineStates({
    Initial: { key: "initial" },
    Done: (ok: boolean, msg?: string) => ({ ok, msg }),
  });
const makeMachine = () => {
  const states = makeStates();
  const m = createMachine(
    states,
    {
      Initial: {
        done: "Done",
        doneFunc: (done: number) =>
          states[done === 100 ? "Done" : "Initial"](true),
        doneAdvFunc:
          (done: string) =>
          ({ type }) => {
            return states[done === "DONE" ? "Done" : "Initial"](
              type === "doneAdvFunc"
            );
          },
      },
      Done: {
        restart: "Initial",
      },
    },
    "Initial"
  );
  const m2 = addEventApi(m);
  return m2;
};

describe("createMachine", () => {
  describe("states", () => {
    const machine = makeMachine();
    it("match with parameterized handlers", () => {
      expect(
        machine.states.Initial().match(
          {
            Initial: () => 100,
            _: () => 0,
          },
          false
        )
      ).toBe(100);

      expect(
        machine.states.Initial().match(
          {
            _: () => 1,
          },
          false
        )
      ).toBe(1);

      expect(() =>
        machine.states.Initial().match({
          InvalidKey: () => 1,
        } as any)
      ).toThrow();

      expect(
        machine.states.Done(true, "test message").match(
          {
            Done: (ok) => ok,
          },
          false
        )
      ).toStrictEqual({ ok: true, msg: "test message" });
    });
  });
  // describe("update()", () => {
  //   describe("updater", () => {
  //     it("receives current event as context", () => {
  //       const machine = makeMachine();
  //       machine.update((context) => {
  //         const event = machine.getChange();
  //         expect(context.from).toEqual(event.from);
  //         return context;
  //       });
  //     });
  //     it("returns new context", () => {
  //       const machine = makeMachine();
  //       machine.update((context) => {
  //         return context;
  //       });
  //     });
  //     it("new context may update state", () => {
  //       const machine = makeMachine();
  //       machine.update((context) => {
  //         return context;
  //       });
  //     });
  //   });
  // });
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
      machine.api.done(true);
      expect(machine.getChange().to.key).toBe("Done");
    });
    it("handles function targets", () => {
      const machine = makeMachine();
      machine.api.doneFunc(100);
      expect(machine.getChange().to.key).toBe("Done");
    });
    it("handles advanced function targets", () => {
      const machine = makeMachine();
      // machine.api
      machine.api.doneAdvFunc("DONE");
      expect(machine.getChange().to.key).toBe("Done");
    });
  });
  describe("send", () => {
    it("invoke send", () => {});
  });
  describe("events", () => {
    it("invoke send", () => {});
  });
});

describe("pure", () => {
  it("should return only getState and send", () => {
    const machine = makeMachine();
    const pureMachine = pure(machine);
    expect(pureMachine.getState).toBe(machine.getState);
    expect(pureMachine.send).toBe(machine.send);
    expect((pureMachine as any).getChange).toBeUndefined();
    expect((pureMachine as any).update).toBeUndefined();
    expect((pureMachine as any).api).toBeUndefined();
    expect(Object.keys(pureMachine)).toEqual(["getState", "send"]);
  });
});

describe("eventApi", () => {
  it("should return an event api", () => {
    const machine = makeMachine();
    const api = machine.api;
    expect(api).toBeDefined();
    expect(typeof api.done).toBe("function");
    expect(typeof api.doneFunc).toBe("function");
    expect(typeof api.doneAdvFunc).toBe("function");
  });
  it("should return an event api for the specified state", () => {
    const machine = makeMachine();
    const doneApi = eventApi(machine, "Done");
    expect(doneApi).toBeDefined();
    expect(doneApi.restart).toBeDefined();
    expect(doneApi.done).toBeUndefined();
    expect(doneApi.doneFunc).toBeUndefined();
    expect(doneApi.doneAdvFunc).toBeUndefined();
  });
});

describe("addEventApi", () => {
  it("should add an event `api` property", () => {
    const machine = makeMachine();
    const api = machine.api;
    expect(api).toBeDefined();
    expect(typeof api.done).toBe("function");
    expect(typeof api.doneFunc).toBe("function");
    expect(typeof api.doneAdvFunc).toBe("function");
  });
  it("should preserve pre-existing api property", () => {
    const machine = makeMachine();
    const api = machine.api;
    expect(api).toBeDefined();
    expect(typeof api.done).toBe("function");
    expect(typeof api.doneFunc).toBe("function");
    expect(typeof api.doneAdvFunc).toBe("function");
    addEventApi(machine);
    expect(machine.api).toBe(api);
  });
});
