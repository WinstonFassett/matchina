import { describe, it, expect, vi } from "vitest";
import { enhanceMethod, methodEnhancer } from "../src/ext";
import { when } from "../src/extras/when";

describe("methodExtend", () => {
  it("should extend the method correctly", () => {
    const obj = {
      method: (value: string) => value.toUpperCase(),
    };

    enhanceMethod(obj, "method", (inner) => {
      return (value: string) => {
        const result = inner(value);
        return result + "!";
      };
    });

    expect(obj.method("hello")).toBe("HELLO!");
  });

  it("should restore the original method", () => {
    const obj = {
      method: (value: string) => value.toUpperCase(),
    };

    const restore = enhanceMethod(obj, "method", (inner) => {
      return (value: string) => {
        const result = inner(value);
        return result + "!";
      };
    });

    restore();

    expect(obj.method("hello")).toBe("HELLO");
  });
});

describe("methodUse", () => {
  it("should extend the method correctly", () => {
    const obj = {
      method: (value: string) => value.toUpperCase(),
    };

    const use = methodEnhancer("method");

    use((inner) => {
      return (value: string) => {
        const result = inner(value);
        return result + "!";
      };
    })(obj);

    expect(obj.method("hello")).toBe("HELLO!");
  });

  it("should restore the original method", () => {
    const obj = {
      method: (value: string) => value.toUpperCase(),
    };

    const use = methodEnhancer("method");

    const restore = use((inner) => {
      return (value: string) => {
        const result = inner(value);
        return result + "!";
      };
    })(obj);

    restore();

    expect(obj.method("hello")).toBe("HELLO");
  });
});

// describe("methodTap", () => {
//   it("should listen to the method and call the provided function", () => {
//     const obj = { method: (value: string) => value.toUpperCase() };
//     const mockFn = vi.fn((value: string) => `Hello, ${value}`);

//     tapMethod("method")(mockFn)(obj);
//     const result = obj.method("world");

//     expect(mockFn).toHaveBeenCalled();
//     expect(result).toBe("WORLD");
//   });
// });

describe("condition", () => {
  it("should call the entryListener when the test passes", () => {
    const mockTest = vi.fn((value: number) => value > 0);
    const mockEntryListener = vi.fn((value: number) => {});

    const conditionFn = when(mockTest, mockEntryListener);
    conditionFn(1);

    expect(mockTest).toHaveBeenCalled();
    expect(mockEntryListener).toHaveBeenCalled();
  });

  it("should not call the entryListener when the test fails", () => {
    const mockTest = vi.fn((value: number) => value > 0);
    const mockEntryListener = vi.fn((value: number) => {});

    const conditionFn = when(mockTest, mockEntryListener);
    conditionFn(-1);

    expect(mockTest).toHaveBeenCalled();
    expect(mockEntryListener).not.toHaveBeenCalled();
  });
});
