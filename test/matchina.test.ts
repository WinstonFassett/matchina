import { describe, it, expect } from "vitest";
import { matchina } from "../src/matchina";
import { defineStates } from "../src/define-states";

describe("matchina", () => {
  it("should create a machine with event API", () => {
    // Create the machine with transitions
    const machine = matchina(
      defineStates({
        Idle: {},
        Running: (speed: number) => ({ speed }),
        Paused: {},
      }),
      {
        Idle: { start: "Running" },
        Running: { pause: "Paused", stop: "Idle" },
        Paused: { resume: "Running", stop: "Idle" },
      },
      "Idle"
    );

    // Test initial state
    expect(machine.getState().key).toBe("Idle");

    // Test event API methods were added
    expect(typeof machine.start).toBe("function");
    expect(typeof machine.pause).toBe("function");
    expect(typeof machine.resume).toBe("function");
    expect(typeof machine.stop).toBe("function");

    // Test transitions using event API
    machine.start(10);
    expect(machine.getState().key).toBe("Running");
    expect(machine.getState().data).toEqual({ speed: 10 });

    machine.pause();
    expect(machine.getState().key).toBe("Paused");

    machine.resume(20);
    expect(machine.getState().key).toBe("Running");
    expect(machine.getState().data).toEqual({ speed: 20 });

    machine.stop();
    expect(machine.getState().key).toBe("Idle");
  });

  it("should create a machine with different state types", () => {
    // Create a machine with different state types
    const machine = matchina(
      defineStates({
        Off: {},
        On: (brightness: number) => ({ brightness }),
        Dimmed: (level: number) => ({ level }),
      }),
      {
        Off: { turnOn: "On" },
        On: { turnOff: "Off", dim: "Dimmed" },
        Dimmed: { turnOff: "Off", brighten: "On" },
      },
      "Off"
    );

    // Test event API methods were added
    expect(typeof machine.turnOn).toBe("function");
    expect(typeof machine.turnOff).toBe("function");
    expect(typeof machine.dim).toBe("function");
    expect(typeof machine.brighten).toBe("function");

    // Test transitions using event API
    machine.turnOn(50);
    expect(machine.getState().key).toBe("On");

    machine.dim(25);
    expect(machine.getState().key).toBe("Dimmed");

    machine.brighten(75);
    expect(machine.getState().key).toBe("On");

    machine.turnOff();
    expect(machine.getState().key).toBe("Off");
  });
});
