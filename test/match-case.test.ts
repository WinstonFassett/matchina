import { describe, it, expect } from "vitest";
import { match } from "../src/match-case";
import { asFilterMatch, matchFilters } from "../src/match-filters";

describe("match", () => {
  it("should match and execute the correct handler", () => {
    const result = match(
      true,
      {
        foo: () => "foo result",
        bar: () => "bar result",
      },
      "foo"
    );
    expect(result).toBe("foo result");
  });

  it("should pass parameters to the handler", () => {
    const result = match(
      true,
      {
        add: (value: unknown) => {
          const [a, b] = value as [number, number];
          return a + b;
        },
      } as const,
      "add",
      [2, 3]
    );
    expect(result).toBe(5);
  });

  it("should use the fallback handler when no match is found", () => {
    const result = match(
      true,
      {
        _: () => "fallback result",
      },
      "unknown"
    );
    expect(result).toBe("fallback result");
  });

  it("should throw an error when no match is found and exhaustive is true", () => {
    expect(() => {
      match(true, {}, "unknown");
    }).toThrow("Match did not handle key: 'unknown'");
  });

  it("should return undefined when no match is found and exhaustive is false", () => {
    const result = match(false, {}, "unknown");
    expect(result).toBeUndefined();
  });

  it("should handle complex objects as parameters", () => {
    const user = { id: 1, name: "Test" };
    const result = match(
      true,
      {
        updateUser: (value: unknown) => {
          const [u] = value as [typeof user];
          return {
            ...u,
            name: "Updated Name",
          };
        },
      } as const,
      "updateUser",
      [user]
    );
    expect(result).toEqual({ id: 1, name: "Updated Name" });
  });

  it("should handle different return types", () => {
    const stringResult = match(true, { test: () => "string" }, "test");
    const numberResult = match(true, { test: () => 123 }, "test");
    const objectResult = match(
      true,
      { test: () => ({ key: "value" }) },
      "test"
    );

    expect(stringResult).toBe("string");
    expect(numberResult).toBe(123);
    expect(objectResult).toEqual({ key: "value" });
  });
});

describe("matchFilters", () => {
  it("should match filters", () => {
    const result = matchFilters(
      { type: "test", from: "Idle", to: "Pending" },
      { type: "test", from: "Idle", to: "Pending" }
    );
    expect(result).toBe(true);
  });
});

describe("asFilterMatch", () => {
  it("should match filters", () => {
    const result = asFilterMatch(
      { type: "test", from: "Idle", to: "Pending" },
      { type: "test", from: "Idle", to: "Pending" }
    );
    expect(result).toEqual({ type: "test", from: "Idle", to: "Pending" });
  });
  it("should throw an error when no match", () => {
    expect(() => {
      asFilterMatch(
        { type: "no-match-test", from: "Idle", to: "Pending" },
        { type: "test", from: "Idle", to: "Pending" }
      );
    }).toThrow("not a match");
  });
});
