import { describe, it, expect, vi } from "vitest";
import { enhanceMethod } from "../src/ext/methodware/enhance-method";

describe("enhanceMethod - stack-safe impl", () => {
  it("restores original only after all enhancers are disposed, regardless of order", () => {
    const calls: string[] = [];
    const obj = {
      greet(name: string) {
        calls.push(`orig:${name}`);
        return `Hello, ${name}`;
      },
    };

    // First enhancer
    const disposer1 = enhanceMethod(obj, "greet", (next) => (name) => {
      calls.push(`e1:${name}`);
      return next(name);
    });
    // Second enhancer
    const disposer2 = enhanceMethod(obj, "greet", (next) => (name) => {
      calls.push(`e2:${name}`);
      return next(name);
    });

    obj.greet("A"); // Should call e2, e1, orig
    expect(calls).toEqual(["e2:A", "e1:A", "orig:A"]);
    calls.length = 0;

    // Dispose first enhancer (out of order)
    disposer1();
    obj.greet("B"); // Should call e2, orig
    expect(calls).toEqual(["e2:B", "orig:B"]);
    calls.length = 0;

    // Dispose second enhancer
    disposer2();
    obj.greet("C"); // Should call only orig
    expect(calls).toEqual(["orig:C"]);
  });
});
