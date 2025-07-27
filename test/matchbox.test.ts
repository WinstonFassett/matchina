import { beforeEach, describe, expect, it } from "vitest";
import {
  MatchboxFactory,
  SpecFromStrings,
  factoryFromMembers,
  matchboxFactory,
} from "../src/matchbox-factory";

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
    expect(a.data).toEqual(undefined);

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
          }, false),
        ).toBe('other [{"data":"test"}]');
      });
      it("should throw with unmatched", () => {
        expect(() =>
          Box.C("test").match({
            A: () => "A",
            B: () => "B",
          } as any),
        ).toThrowErrorMatchingInlineSnapshot(`"Match did not handle key: 'C'"`);
      });
    });
  });
  it("non-exhaustive", () => {
    const c = Box.C("test");
    c.match({ _() {} }, false);
    const matched = c.match(
      {
        C: ({ data }) => data,
      },
      false,
    );
    expect(matched).toBe("test");
  });
  describe("as", () => {
    it("should return this when the tag is correct", () => {
      const box = Box.A();
      expect(box.as("A")).toBe(box);
    });

    it("should throw an error when the tag is incorrect", () => {
      const box = Box.A();
      expect(() => box.as("B")).toThrowError(
        `Attempted to cast ${box.testKey} as B`,
      );
    });
  });
  describe("is", () => {
    it("should return true when the tag matches", () => {
      const box = Box.A();
      expect(box.is("A")).toBe(true);
    });

    it("should return false when the tag does not match", () => {
      const box = Box.A();
      expect(box.is("B")).toBe(false);
    });
  });
  describe("from string array", () => {
    const strings = ["A", "B", "C"] as const;
    type TestSpecType = SpecFromStrings<typeof strings>;

    it("should create a matchboxFactory with a spec of { key: identityFunction }", () => {
      const Box = matchboxFactory(["A", "B", "C"] as const, "testKey");

      const a = Box.A("A");
      const b = Box.B({ name: "B" });
      const c = Box.C(false);
      expect(a.testKey).toBe("A");
      expect(a.data).toEqual("A");
      expect(b.testKey).toBe("B");
      expect(b.data).toEqual({ name: "B" });
      expect(c.testKey).toBe("C");
      expect(c.data).toEqual(false);

      const values = [a, b, c].map((box) =>
        box.match({
          A: (a) => a,
          B: (b) => b,
          C: (c) => c,
        }),
      );
      expect(values).toEqual(["A", { name: "B" }, false]);
    });
  });
});
// describe("extendFactory", () => {
//   it("should extend factories", () => {
//     const Box = matchboxFactory({ A: {howdy: true} }, "testKey");
//     const Box2 = matchboxFactory({ B: undefined }, "testKey");
//     const Box3 = extendFactory(Box, Box2);
//     type X = Simplify<typeof Box3>;
//     expect(Object.keys(Box3)).toEqual(["A", "B"]);
//     const a = Box3.A();
//     const b = Box3.B();
//     expect(a.testKey).toBe("A");
//     expect(a.data).toEqual({howdy: true});
//     expect(b.testKey).toBe("B");
//     expect(a.match({ A: () => "A", B: () => "B" })).toBe("A");
//   })
// })
describe("factoryFromMembers", () => {
  it("should create a factory from members", () => {
    const Box = matchboxFactory({ A: () => ({ howdy: true }) }, "testKey");
    const Box2 = matchboxFactory({ B: 1 }, "testKey");
    const Box3 = factoryFromMembers({ ...Box, ...Box2 });
    const a = Box3.A();
    const b = Box3.B();

    expect(a.testKey).toBe("A");
    expect(a.data).toEqual({ howdy: true });
    expect(b.testKey).toBe("B");
    expect(a.match({ A: () => "A", B: () => "B" })).toBe("A");
  });
});
