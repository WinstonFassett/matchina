import { describe, it, expect } from "vitest";
import { 
  defineMachine, 
  defineSubmachine, 
  createMachineFrom 
} from "../src/definitions";
import { defineStates } from "../src";

describe("Machine Definitions", () => {
  describe("defineMachine", () => {
    it("should create a machine definition from state factory", () => {
      const states = defineStates({
        Idle: undefined,
        Active: undefined
      });
      
      const transitions = {
        Idle: { activate: "Active" },
        Active: { deactivate: "Idle" }
      };
      
      const def = defineMachine(states, transitions, "Idle");
      
      expect(def.states).toBe(states);
      expect(def.transitions).toBe(transitions);
      expect(def.initial).toBe("Idle");
    });

    it("should create a machine definition from plain object", () => {
      const def = defineMachine(
        {
          Idle: undefined,
          Active: undefined
        },
        {
          Idle: { activate: "Active" },
          Active: { deactivate: "Idle" }
        },
        "Idle"
      );
      
      expect(typeof def.states.Idle).toBe("function");
      expect(typeof def.states.Active).toBe("function");
      expect(def.transitions.Idle.activate).toBe("Active");
      expect(def.initial).toBe("Idle");
    });
  });

  describe("defineSubmachine", () => {
    it("should create a submachine marker", () => {
      const sub = defineSubmachine(
        {
          A: undefined,
          B: undefined
        },
        {
          A: { next: "B" },
          B: { back: "A" }
        },
        "A"
      );
      
      expect(sub.machine).toBeDefined();
      expect(sub.machine.initial).toBe("A");
      expect(typeof sub.machine.states.A).toBe("function");
    });

    it("should handle nested submachines", () => {
      const sub = defineSubmachine(
        {
          A: defineSubmachine(
            { X: undefined, Y: undefined },
            { X: { toggle: "Y" }, Y: { toggle: "X" } },
            "X"
          ),
          B: undefined
        },
        {
          A: { next: "B" },
          B: { back: "A" }
        },
        "A"
      );
      
      expect(sub.machine).toBeDefined();
      expect(sub.machine.initial).toBe("A");
    });
  });
  
  describe("createMachineFrom", () => {
    it("should create a working machine from definition", () => {
      const def = defineMachine(
        {
          Idle: undefined,
          Active: undefined
        },
        {
          Idle: { activate: "Active" },
          Active: { deactivate: "Idle" }
        },
        "Idle"
      );
      
      const machine = createMachineFrom(def);
      
      expect(machine.getState().key).toBe("Idle");
      machine.send("activate");
      expect(machine.getState().key).toBe("Active");
    });
  });
});
