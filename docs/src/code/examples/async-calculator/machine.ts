import { createPromiseMachine } from "matchina";

// Function to create a promise machine for async addition
export function createAsyncCalculatorMachine() {
  return createPromiseMachine(
    (a: number, b: number) =>
      new Promise<number>((resolve) => setTimeout(() => resolve(a + b), 1000)),
  );
}
