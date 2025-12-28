import { describe, it, expect } from "vitest";
import { createMachine } from "xstate";
import { getAvailableActions } from "../src/state-machine-actions";

describe("getAvailableActions", () => {
  it("should return available actions for the current state", () => {
    // Define a simple state machine transitions object
    const states = {
      IDLE: {},
      RUNNING: {},
      PAUSED: {},
    };

    const machine = createMachine(states, {
      IDLE: {
        START: "RUNNING",
        RESET: "IDLE",
      },
      RUNNING: {
        PAUSE: "PAUSED",
        STOP: "IDLE",
      },
      PAUSED: {
        RESUME: "RUNNING",
        STOP: "IDLE",
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

    // Test STOPPED state
    expect(getAvailableActions(machine.transitions, "STOPPED")).toEqual(["RESET"]);
  });

  it("should return an empty array for unknown states", () => {
    const states = {
      IDLE: {},
      RUNNING: {},
    };

    const machine = createMachine(states, {
      IDLE: {
        START: "RUNNING",
      },
    }, "IDLE");

    expect(getAvailableActions(machine.transitions, "UNKNOWN_STATE")).toEqual([]);
  });

  it("should work with empty transitions", () => {
    expect(getAvailableActions({}, "ANY_STATE")).toEqual([]);
  });
});
