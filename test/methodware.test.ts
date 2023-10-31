import { test, expect } from "vitest";
import { MethodEnhancer, methodware, wrapMethod } from "../src/extras/wrap-method";


test('wraps and restores method', () => {
  const subject = {
    value: 1,
    increment() {
      this.value++;
    },
  };

  const doubler: MethodEnhancer<typeof subject, 'increment'> = (original) => {
    original();
    original();
  };

  const restore = wrapMethod(subject, 'increment', doubler);

  subject.increment();

  // The increment method has been doubled
  expect(subject.value).toBe(3);

  restore();
  subject.increment();

  // The increment method is normal again
  expect(subject.value).toBe(4);
});

test('applies multiple methodware and restores', () => {
  const subject = {
    value: 1,
    increment() {
      this.value++;
    },
  };

  const doubler: MethodEnhancer<typeof subject, 'increment'> = (original) => {
    original();
    original();
  };

  const addTen: MethodEnhancer<typeof subject, 'increment'> = (original) => {
    original();
    subject.value += 10;
  }

  const restore = methodware(subject, 'increment', [doubler, addTen]);

  subject.increment();

  // The increment method has been doubled and then 10 was added
  expect(subject.value).toBe(13);

  restore();
  subject.increment();

  // The increment method is normal again
  expect(subject.value).toBe(14);
});

test('logging enhancer', async () => {
    const subject = {
      add: (num1: number, num2: number) => {
        return num1 + num2;
      }    
    }    
    expect(subject.add(2, 3)).toBe(5)
    
    const restore = methodware(subject, 'add', [
      (orig, num1, num2) => orig(num1, num2)*10
    ]);    
    expect(subject.add(2, 3)).toBe(50);

    restore()
    expect(subject.add(2, 3)).toBe(5)
});
