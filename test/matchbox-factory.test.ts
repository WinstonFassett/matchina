import { describe, it, expect } from "vitest";
import { matchboxFactory } from "../src/matchbox-factory";

describe("matchboxFactory", () => {
  it("should create a matchboxFactory with correct keys", () => {
    const config = {
      A: undefined,
      B: { id: 1 },
      C: (data: string) => ({ data }),
    } as const;
    const Box = matchboxFactory(config);
    expect(Object.keys(Box)).toEqual(["A", "B", "C"]);
  });

  it("should create a matchbox according to spec", () => {
    const config = {
      A: undefined,
      B: { id: 1 },
      C: (data: string) => ({ data }),
    } as const;

    const Box = matchboxFactory(config);

    const a = Box.A();
    expect(a.tag).toBe("A");
    expect(a.data).toEqual({});

    const b = Box.B();
    expect(b.tag).toBe("B");
    expect(b.data).toEqual({ id: 1 });

    const c = Box.C("hello");
    expect(c.tag).toBe("C");
    expect(c.data).toEqual({ data: "hello" });
  });
});
