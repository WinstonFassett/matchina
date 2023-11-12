import { describe, expect, it, vi } from "vitest";
import { applyMethodware } from "../playground/koa-compose";

describe("applyMethodware", () => {
  it("applies middleware to sync target method", async () => {
    const middleware1 = vi.fn((next) => (value: number) => next(value + 1));
    const middleware2 = vi.fn((next) => (value: number) => next(value * 2));
    const subject = {
      addOne: (value: number) => value + 1,
    };
    applyMethodware(subject, "addOne", middleware1, middleware2);
    const result = await subject.addOne(1);
    expect(result).toBe(4);
    expect(middleware1).toHaveBeenCalledWith(subject.addOne);
    expect(middleware2).toHaveBeenCalledWith(middleware1);
  });

  // it("applies middleware to async target method", async () => {
  //   const middleware1 = vi.fn((next) => async (value: number) =>
  //     next(value + 1)
  //   );
  //   const middleware2 = vi.fn((next) => async (value: number) =>
  //     next(value * 2)
  //   );
  //   const subject = {
  //     async addOneAsync(value: number) {
  //       return value + 1;
  //     },
  //   };
  //   applyMethodware(subject, "addOneAsync", middleware1, middleware2);
  //   const result = await subject.addOneAsync(1);
  //   expect(result).toBe(4);
  //   expect(middleware1).toHaveBeenCalledWith(subject.addOneAsync);
  //   expect(middleware2).toHaveBeenCalledWith(middleware1);
  // });
});