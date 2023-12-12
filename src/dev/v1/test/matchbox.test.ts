import { beforeEach, describe, expect, it } from "vitest";
import {
  MatchboxFactory,
  extendFactory,
  matchboxFactory,
} from "../../../matchbox";

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
          `"Match did not handle key: 'C'"`,
        );
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
});

describe("extendFactory", () => {
  const testConfig = {
    A: undefined,
    B: { id: 1 },
    C: (data: string) => ({ data }),
  } as const;
  let Box: MatchboxFactory<typeof testConfig, "tag">;
  beforeEach(() => {
    Box = matchboxFactory(testConfig, "tag");
  });

  it("should extend the factory with the given config", () => {
    const extendedFactory = extendFactory(Box, {
      D: { name: "John" },
      E: (age: number) => ({ age }),
    });

    expect(Object.keys(extendedFactory)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("should return a factory with combined config", () => {
    const extendedFactory = extendFactory(Box, {
      D: { name: "John" },
      E: (age: number) => ({ age }),
    });

    const d = extendedFactory.D();
    expect(d.tag).toBe("D");
    expect(d.data).toEqual({ name: "John" });

    const e = extendedFactory.E(25);
    expect(e.tag).toBe("E");
    expect(e.data).toEqual({ age: 25 });
  });
});
