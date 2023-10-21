import { describe, it, expect } from "vitest";
import { unionize } from "../src/unionize";

describe("unionize", () => {
  it("should create a union object with correct keys", () => {
    const config = {
      A: undefined,
      B: { id: 1 },
      C: (data: string) => ({ data }),
    } as const;

    const union = unionize(config);

    expect(Object.keys(union)).toEqual(["A", "B", "C"]);
  });

  it("should create a union object with correct values", () => {
    const config = {
      A: undefined,
      B: { id: 1 },
      C: (data: string) => ({ data }),
    } as const;

    const union = unionize(config);

    const a = union.A();
    expect(a.tag).toBe("A");
    expect(a.data).toEqual({});

    const b = union.B();
    expect(b.tag).toBe("B");
    expect(b.data).toEqual({ id: 1 });

    const c = union.C("hello");
    expect(c.tag).toBe("C");
    expect(c.data).toEqual({ data: "hello" });
  });
});
