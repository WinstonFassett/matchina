---
title: "machine.test"
description: "Add description here"
---


```ts
import { describe, expect, it, vi } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine, withApi } from "../src";

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
              type === "doneAdvFunc",
            );
          },
      },
      Done: {},
    },
    "Initial",
  );
  const m2 = withApi(m);
  return m2;
};

describe("createMachine", () => {
  describe("states", () => {
    const machine = makeMachine();
    it("match with parameterized handlers", () => {
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

      expect(
        machine.states.Done(true, "test message").match(
          {
            Done: (ok) => ok,
          },
          false,
        ),
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
  // it("events can match", () => {
  //   const machine = makeMachine();
  //   machine.api.done(true);
  //   const mustBeOk = machine.getChange().match({
  //     done: (ok) => {
  //       console.log("ok?", ok);
  //       return "ok" as const;
  //     },
  //   });
  //   console.log({ mustBeOk });
  //   const mustBeThing = machine.getChange().match({
  //     _: () => {
  //       return "thing" as const;
  //     },
  //   });
  //   console.log({ mustBeThing });
  // });
});
```
