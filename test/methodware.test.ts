/* eslint-disable unicorn/consistent-function-scoping */
import { expect, test } from "vitest";
import {
  beforeAfterEnhancer,
  debounceEnhancer,
  errorHandlingEnhancer,
  loggingEnhancer,
  methodware,
  methodwareEnhancer,
  timingEnhancer,
  wrapMethod,
} from "../src/extras/methodware";
import { Func } from "../src/types";

const doubler = (original: Func, ...args: any[]) => {
  original(...args);
  original(...args);
};

const addTenMore = (original: Func, value?: number) => {
  original((value ?? 0) + 10);
};

test("wraps and restores method", () => {
  const subject = {
    value: 1,
    increment() {
      this.value++;
    },
  };

  const restore = wrapMethod(subject, "increment", doubler);

  subject.increment();

  // The increment method has been doubled
  expect(subject.value).toBe(3);

  restore();
  subject.increment();

  // The increment method is normal again
  expect(subject.value).toBe(4);
});

test("applies multiple methodware and restores", () => {
  const subject = {
    value: 1,
    increment(amount = 1) {
      console.log("increment", amount);
      this.value += amount;
    },
  };

  const restore = methodware(subject, "increment", [addTenMore, doubler]);

  subject.increment();

  // The increment method has been doubled and then 10 was added
  expect(subject.value).toBe(21);

  restore();
  subject.increment();

  // The increment method is normal again
  expect(subject.value).toBe(22);
});

test("logging enhancer", () => {
  const subject = {
    add: (num1: number, num2: number) => {
      return num1 + num2;
    },
  };
  expect(subject.add(2, 3)).toBe(5);

  const restore = methodware(subject, "add", [
    (orig, num1, num2) => orig(num1, num2) * 10,
  ]);
  expect(subject.add(2, 3)).toBe(50);

  restore();
  expect(subject.add(2, 3)).toBe(5);
});
test("logging enhancer", () => {
  const subject = {
    add: (num1: number, num2: number) => {
      return num1 + num2;
    },
  };
  expect(subject.add(2, 3)).toBe(5);

  const restore = wrapMethod(subject, "add", loggingEnhancer("LOG TEST"));
  expect(subject.add(2, 3)).toBe(5);

  restore();
});

test("error handling enhancer", () => {
  const subject = {
    divide: (num1: number, num2: number) => {
      if (num2 === 0) {
        throw new Error("Cannot divide by zero");
      }
      return num1 / num2;
    },
  };
  expect(() => subject.divide(10, 2)).not.toThrow();
  expect(() => subject.divide(10, 0)).toThrow();

  const restore = wrapMethod(subject, "divide", errorHandlingEnhancer);
  expect(subject.divide(10, 2)).toBe(5);
  expect(subject.divide(10, 0)).toBeUndefined();

  restore();
});

test("timing enhancer", () => {
  const subject = {
    slowAdd: (num1: number, num2: number) => {
      let result = 0;
      for (let i = 0; i < 100_000_000; i++) {
        result += i;
      }
      return num1 + num2 + result;
    },
  };
  expect(subject.slowAdd(2, 3)).toBeGreaterThan(0);

  const restore = wrapMethod(subject, "slowAdd", (orig, a, b) => {
    return timingEnhancer(orig, a, b);
    return orig(a, b);
  });
  expect(subject.slowAdd(2, 3)).toBeGreaterThan(0);

  restore();
});

test("before after enhancer", () => {
  const subject = {
    add: (num1: number, num2: number) => {
      return num1 + num2;
    },
  };
  expect(subject.add(2, 3)).toBe(5);

  const before = (num1: number, num2: number) => {
    console.log(`Before add: ${num1}, ${num2}`);
    return (result: number) => {
      console.log(`After add: ${result}`);
    };
  };
  const restore = methodware(subject, "add", [beforeAfterEnhancer(before)]);
  expect(subject.add(2, 3)).toBe(5);

  restore();
});

test("methodware enhancer", () => {
  const subject = {
    add: (num1: number, num2: number) => {
      return num1 + num2;
    },
  };
  expect(subject.add(2, 3)).toBe(5);

  const restore = wrapMethod(
    subject,
    "add",
    methodwareEnhancer(subject, "add", [
      timingEnhancer,
      errorHandlingEnhancer,
      loggingEnhancer("first logger"),
      loggingEnhancer("second logger"),
    ]),
  );
  console.log("TEST");
  expect(subject.add(2, 3)).toBe(5);

  restore();
});

test("debounce enhancer", async () => {
  let count = 0;
  const subject = {
    expensive: () => {
      console.log("expensive");
      count++;
    },
  };
  subject.expensive();
  expect(count).toBe(1);
  const restore = wrapMethod(subject, "expensive", debounceEnhancer(100));
  subject.expensive();
  subject.expensive();
  subject.expensive();
  expect(count).toBe(1);
  restore();
  subject.expensive();
  expect(count).toBe(2);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(count).toBe(3);
});

test("log-debounce-log middleware", async () => {
  let count = 0;
  const subject = {
    expensive: () => {
      count++;
      console.log("mock expensive thing", count);
      return { result: "that was expensive" };
    },
  };
  subject.expensive();
  expect(count).toBe(1);
  const restore = wrapMethod(
    subject,
    "expensive",
    methodwareEnhancer(subject, "expensive", [
      // loggingEnhancer('above debounce'),
      debounceEnhancer(100),
      loggingEnhancer("below debounce"),
    ]),
  );
  console.log("second call to expansive");
  subject.expensive();
  subject.expensive();
  subject.expensive();
  // expect(count).toBe(1)
  restore();
  subject.expensive();
  expect(count).toBe(2);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(count).toBe(3);
});
