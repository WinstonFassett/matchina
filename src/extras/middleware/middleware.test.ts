import { describe, expect, it, vi } from "vitest";
import { applyMiddleware } from "./middleware";

describe.skip("applyMiddleware", () => {
  it("returns the original function if no middleware is provided", () => {
    const originalFn = vi.fn((a: number, b: number) => a + b);
    const wrappedFn = applyMiddleware(originalFn);
    expect(wrappedFn(1, 2)).toBe(3);
    expect(originalFn).toHaveBeenCalledTimes(1);
  });

  it("applies a single middleware function", () => {
    const originalFn = vi.fn((a: number, b: number) => a + b);
    const middleware = vi.fn(
      (next) => (a: number, b: number) => next(a + 1, b + 1),
    );
    const wrappedFn = applyMiddleware(originalFn, middleware);
    expect(wrappedFn(1, 2)).toBe(5);
    expect(originalFn).toHaveBeenCalledTimes(1);
    expect(middleware).toHaveBeenCalledTimes(1);
  });

  it("applies multiple middleware functions in order", () => {
    const originalFn = vi.fn((a: number, b: number) => a + b);
    const middleware1 = vi.fn(
      (next) => (a: number, b: number) => next(a + 1, b + 1),
    );
    const middleware2 = vi.fn(
      (next) => (a: number, b: number) => next(a * 2, b * 2),
    );
    const wrappedFn = applyMiddleware(originalFn, middleware1, middleware2);
    expect(wrappedFn(1, 2)).toBe(12);
    expect(originalFn).toHaveBeenCalledTimes(1);
    expect(middleware1).toHaveBeenCalledTimes(1);
    expect(middleware2).toHaveBeenCalledTimes(1);
  });

  it("returns a promise if any middleware returns a promise", async () => {
    const originalFn = vi.fn((a: number, b: number) => a + b);
    const middleware = vi.fn((next) => async (a: number, b: number) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return next(a + 1, b + 1);
    });
    const wrappedFn = applyMiddleware(originalFn, middleware);
    const result = await wrappedFn(1, 2);
    expect(result).toBe(5);
    expect(originalFn).toHaveBeenCalledTimes(1);
    expect(middleware).toHaveBeenCalledTimes(1);
  });
});
