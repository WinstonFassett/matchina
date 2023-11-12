import { describe, expect, it, vi } from "vitest";
import { applyMethodware } from "../src/dev/middleware4";

describe("applyMethodware", () => {
  it("applies middleware to sync target method", async () => {
    const mw1 = (next: any) => (value: number) => next(value + 1)
    const mw2 = (next: any) => (value: number) => next(value * 2)
    const middleware1 = vi.fn(mw1);
    const middleware2 = vi.fn(mw2);
    const subject = {
      addOne: (value: number) => value + 1,
    };
    const orig = subject.addOne;
    applyMethodware(subject, "addOne", middleware1, middleware2);
    const result = await subject.addOne(1);
    expect(result).toBe(4);
    expect(middleware1).toHaveBeenCalledWith(orig);
    expect(middleware2).toHaveBeenCalled()
  });

  it("applies middleware to async target method", async () => {
    const middleware1 = vi.fn((next) => async (value: number) =>
      next(value + 1)
    );
    const middleware2 = vi.fn((next) => async (value: number) =>
      next(value * 2)
    );
    const subject = {
      async addOneAsync(value: number) {
        return value + 1;
      },
    };
    const orig = subject.addOneAsync
    applyMethodware(subject, "addOneAsync", middleware1, middleware2);
    const result = await subject.addOneAsync(1);
    expect(result).toBe(4);
    expect(middleware1).toHaveBeenCalledWith(orig);
    expect(middleware2).toHaveBeenCalled();
  });
});