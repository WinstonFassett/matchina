import { describe, it, expect, vi } from "vitest";
import { guardExecute } from "../src/promise-machine-hooks";

describe("guardExecute", () => {
  it("should allow execution when guard condition passes", () => {
    // Create a mock function
    const mockFn = vi.fn().mockReturnValue("result");

    // Create an object with an execute method
    const target = { execute: mockFn };

    // Create a guard that allows execution
    const guard = vi.fn().mockReturnValue(true);

    // Apply the guard to the execute method
    const dispose = guardExecute(guard)(target as any);

    // Call the enhanced execute method
    const result = target.execute(1, 2, 3);

    // Verify the result
    expect(result).toBe("result");
    expect(guard).toHaveBeenCalledWith(1, 2, 3);
    expect(mockFn).toHaveBeenCalledWith(1, 2, 3);

    // Cleanup
    dispose();
  });

  it("should prevent execution when guard condition fails", () => {
    // Create a mock function that should never be called
    const mockFn = vi.fn();

    // Create an object with an execute method
    const target = { execute: mockFn };

    // Create a guard that prevents execution
    const guard = vi.fn().mockReturnValue(false);

    // Apply the guard to the execute method
    const dispose = guardExecute(guard)(target as any);

    // Verify the guard throws
    expect(() => target.execute(1, 2, 3)).toThrow("Guard condition failed");
    expect(guard).toHaveBeenCalledWith(1, 2, 3);
    expect(mockFn).not.toHaveBeenCalled();

    // Cleanup
    dispose();
  });

  it("should allow execution again after guard is removed", () => {
    // Create a mock function
    const mockFn = vi.fn().mockReturnValue("result");

    // Create an object with an execute method
    const target = { execute: mockFn };

    // Create a guard that prevents execution
    const guard = vi.fn().mockReturnValue(false);

    // Apply the guard to the execute method
    const dispose = guardExecute(guard)(target as any);

    // Verify the guard prevents execution
    expect(() => target.execute(1, 2, 3)).toThrow("Guard condition failed");

    // Remove the guard
    dispose();

    // Now the original function should work
    const result = target.execute(1, 2, 3);
    expect(result).toBe("result");
    expect(mockFn).toHaveBeenCalledWith(1, 2, 3);
  });
});
