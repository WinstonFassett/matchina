import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { getAvailableActions } from "../src/state-machine-actions";

describe("getAvailableActions", () => {
  it("should return available actions for the current state", () => {
    const states = defineStates({
      IDLE: () => ({ key: "IDLE" }),
      RUNNING: () => ({ key: "RUNNING" }),
      PAUSED: () => ({ key: "PAUSED" }),
    });

    const machine = createMachine(states, {
      IDLE: {
        START: () => states.RUNNING(),
        RESET: () => states.IDLE(),
      },
      RUNNING: {
        PAUSE: () => states.PAUSED(),
        STOP: () => states.IDLE(),
      },
      PAUSED: {
        RESUME: () => states.RUNNING(),
        STOP: () => states.IDLE(),
      },
    }, "IDLE");

    // Test IDLE state
    expect(getAvailableActions(machine.transitions, "IDLE")).toEqual([
      "START",
      "RESET",
    ]);

    // Test RUNNING state
    expect(getAvailableActions(machine.transitions, "RUNNING")).toEqual([
      "PAUSE",
      "STOP",
    ]);

    // Test PAUSED state
    expect(getAvailableActions(machine.transitions, "PAUSED")).toEqual([
      "RESUME",
      "STOP",
    ]);
  });

  it("should return an empty array for unknown states", () => {
    const states = defineStates({
      IDLE: () => ({ key: "IDLE" }),
      RUNNING: () => ({ key: "RUNNING" }),
    });

    const machine = createMachine(states, {
      IDLE: {
        START: () => states.RUNNING(),
      },
    }, "IDLE");

    expect(getAvailableActions(machine.transitions, "UNKNOWN_STATE")).toEqual([]);
  });

  it("should work with empty transitions", () => {
    expect(getAvailableActions({}, "ANY_STATE")).toEqual([]);
  });
});
