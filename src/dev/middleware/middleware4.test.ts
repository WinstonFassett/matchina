import { describe, expect, it } from "vitest";
import { applyMiddleware, Middleware } from "./middleware4";

describe("applyMiddleware", () => {
  // Define a synchronous function for testing
  function syncSum(a: number, b: number) {
    return a + b;
  }

  // Define an asynchronous function for testing
  async function asyncSum(a: number, b: number) {
    return new Promise<number>((resolve) => {
      setTimeout(() => resolve(a + b), 200);
    });
  }

  it("should work with synchronous function and logger middleware", () => {
    const loggerMiddleware =
      (next) =>
      (...args) => {
        expect(args).toEqual([2, 3]);
        const result = next(...args);
        expect(result).toBe(5);
        return result;
      };

    const enhancedSyncSum = applyMiddleware(syncSum, loggerMiddleware);
    const result = enhancedSyncSum(2, 3);

    // Perform assertions on the result and check if logs are as expected
    expect(result).toBe(5);
  });

  it("should work with asynchronous function and logger middleware", async () => {
    const loggerMiddleware: Middleware<any, any> =
      (next) =>
      async (...args) => {
        expect(args).toEqual([4, 5]);
        const result = await next(...args);
        expect(result).toBe(9);
        return result;
      };

    const enhancedAsyncSum = applyMiddleware(asyncSum, loggerMiddleware);
    const result = await enhancedAsyncSum(4, 5);

    // Perform assertions on the result and check if logs are as expected
    expect(result).toBe(9);
  });
});
