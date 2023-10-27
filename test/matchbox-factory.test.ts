import { beforeEach, describe, expect, it } from "vitest";
import { MatchboxFactory, matchboxFactory } from "../src/matchbox";

describe("matchboxFactory", () => {
  const testConfig = {
    A: undefined,
    B: { id: 1 },
    C: (data: string) => ({ data }),
  } as const;
  let Box: MatchboxFactory<typeof testConfig, "testKey">;
  beforeEach(() => {
    Box = matchboxFactory(testConfig, "testKey");
  });
  it("should create a matchboxFactory with correct keys", () => {
    expect(Object.keys(Box)).toEqual(["A", "B", "C"]);
  });

  it("should create a matchbox according to spec", () => {
    const a = Box.A();
    expect(a.testKey).toBe("A");
    expect(a.data).toEqual({});

    const b = Box.B();
    expect(b.testKey).toBe("B");
    expect(b.data).toEqual({ id: 1 });

    const c = Box.C("hello");
    expect(c.testKey).toBe("C");
    expect(c.data).toEqual({ data: "hello" });
  });
  describe("match", () => {
    describe("exhaustive (by default)", () => {
      it("should match with exhaustive", () => {
        // match all, a, b, c with no _
        expect(
          Box.C("test").match({
            A: () => "A",
            B: () => "B",
            C: () => "C",
          }),
        ).toBe("C");
      });
      it("should match with _ and partial exhaustive", () => {
        expect(
          Box.C("test").match({
            A: () => "A",
            _: (...args) => `other ${JSON.stringify(args)}`,
          }),
        ).toBe('other [{"data":"test"}]');
      });
      it("should throw with unmatched", () => {
        expect(() =>
          Box.C("test").match({
            A: () => "A",
            B: () => "B",
          } as any),
        ).toThrowErrorMatchingInlineSnapshot(
          `"Match did not handle testKey: 'C'"`,
        );
      });
    });
  });
  it("non-exhaustive", () => {
    const c = Box.C("test");
    const matched = c.match(
      {
        C: ({ data }) => data,
      },
      false,
    );
    expect(matched).toBe("test");
  });
});
