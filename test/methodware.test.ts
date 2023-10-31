import { expect, test } from "vitest";
import { Func, methodware, wrapMethod } from "../src/extras/methodware";

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
