import { describe, it, expect } from "vitest";
import { getAvailableActions } from "../src/state-machine-actions";

describe("getAvailableActions", () => {
  it("should return available actions for the current state", () => {
    // Define a simple state machine transitions object
    const transitions = {
      IDLE: {
        START: "RUNNING",
        RESET: "IDLE",
      },
      RUNNING: {
        PAUSE: "PAUSED",
        STOP: "STOPPED",
      },
      PAUSED: {
        RESUME: "RUNNING",
        STOP: "STOPPED",
      },
      STOPPED: {
        RESET: "IDLE",
      },
    };

    // Test IDLE state
    expect(getAvailableActions(transitions, "IDLE")).toEqual([
      "START",
      "RESET",
    ]);

    // Test RUNNING state
    expect(getAvailableActions(transitions, "RUNNING")).toEqual([
      "PAUSE",
      "STOP",
    ]);

    // Test PAUSED state
    expect(getAvailableActions(transitions, "PAUSED")).toEqual([
      "RESUME",
      "STOP",
    ]);

    // Test STOPPED state
    expect(getAvailableActions(transitions, "STOPPED")).toEqual(["RESET"]);
  });

  it("should return an empty array for unknown states", () => {
    const transitions = {
      IDLE: {
        START: "RUNNING",
      },
    };

    expect(getAvailableActions(transitions, "UNKNOWN_STATE")).toEqual([]);
  });

  it("should work with empty transitions", () => {
    expect(getAvailableActions({}, "ANY_STATE")).toEqual([]);
  });
});
