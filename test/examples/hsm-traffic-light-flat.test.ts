import { describe, it, expect } from "vitest";
import { createFlatTrafficLight } from "../../docs/src/code/examples/hsm-traffic-light/machine-flat";

describe("HSM Traffic Light (Flat)", () => {
  it("should initialize to Working.Red", () => {
    const machine = createFlatTrafficLight();
    expect(machine.getState().key).toBe("Working.Red");
  });

  it("should cycle through light states on tick", () => {
    const machine = createFlatTrafficLight();

    // Start at Red
    expect(machine.getState().key).toBe("Working.Red");

    // Tick to Green
    machine.send("tick");
    expect(machine.getState().key).toBe("Working.Green");

    // Tick to Yellow
    machine.send("tick");
    expect(machine.getState().key).toBe("Working.Yellow");

    // Tick back to Red
    machine.send("tick");
    expect(machine.getState().key).toBe("Working.Red");
  });

  it("should transition to Broken from any Working state", () => {
    const machine = createFlatTrafficLight();

    // From Red
    machine.send("break");
    expect(machine.getState().key).toBe("Broken");
  });

  it("should transition to Maintenance from any Working state", () => {
    const machine = createFlatTrafficLight();

    // Go to Green
    machine.send("tick");
    expect(machine.getState().key).toBe("Working.Green");

    // Go to maintenance
    machine.send("maintenance");
    expect(machine.getState().key).toBe("Maintenance");
  });

  it("should repair from Broken to Working.Red", () => {
    const machine = createFlatTrafficLight();

    machine.send("break");
    expect(machine.getState().key).toBe("Broken");

    machine.send("repair");
    expect(machine.getState().key).toBe("Working.Red");
  });

  it("should complete maintenance and return to Working.Red", () => {
    const machine = createFlatTrafficLight();

    machine.send("maintenance");
    expect(machine.getState().key).toBe("Maintenance");

    machine.send("complete");
    expect(machine.getState().key).toBe("Working.Red");
  });

  it("should have hierarchical shape metadata", () => {
    const machine = createFlatTrafficLight();

    // Verify shape exists for visualization
    expect((machine as any).shape).toBeDefined();
  });
});
