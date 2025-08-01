import { describe, it, expect, vi } from "vitest";
import {
  enhanceMethod,
  createMethodEnhancer,
  enhanceFunction,
} from "../src/ext";
import { when } from "../src/extras/when";

describe("enhanceFunction", () => {
  it("should enhance a function with additional behavior", () => {
    const originalFn = (x: number) => x * 2;
    const enhancedFunc = enhanceFunction(originalFn);
    enhancedFunc.add((next) => (x: number) => {
      return next(x + 1);
    });
    enhancedFunc.add((next) => (x: number) => {
      return next(x * 3);
    });
    expect(enhancedFunc(2)).toBe(14); // ((2*3)+1) * 2
  });
  describe("result", () => {
    it("should return the original function result when no enhancements are applied", () => {
      const originalFn = (x: number) => x * 2;
      const enhancedFunc = enhanceFunction(originalFn);
      expect(enhancedFunc(3)).toBe(6);
    });

    it("should return the enhanced function result when enhancements are applied", () => {
      const originalFn = (x: number) => x * 2;
      const enhancedFunc = enhanceFunction(originalFn);
      enhancedFunc.add((next) => (x: number) => next(x + 1));
      expect(enhancedFunc(3)).toBe(8); // (3 + 1) * 2
    });
    it("has(enhancer) should return true if the enhancer is present and false if not", () => {
      const originalFn = (x: number) => x * 2;
      const enhancedFunc = enhanceFunction(originalFn);
      const enhancer = (next: any) => (x: number) => next(x + 1);
      enhancedFunc.add(enhancer);
      expect(enhancedFunc.has(enhancer)).toBe(true);
      expect(enhancedFunc.has((next: any) => (x: number) => next(x + 2))).toBe(
        false
      );
    });
  });
});

describe("enhanceMethod", () => {
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

  it("should use method stub if no method exists", () => {
    const obj = {} as any;

    enhanceMethod(obj, "method", (inner) => {
      return (value: string) => {
        const result = inner(value);
        return result + "!";
      };
    });

    expect(obj.method("hello")).toBe("undefined!");
  });
});

describe("createMethodEnhancer", () => {
  it("should extend the method correctly", () => {
    const obj = {
      method: (value: string) => value.toUpperCase(),
    };

    const use = createMethodEnhancer("method");

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

    const use = createMethodEnhancer("method");

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
