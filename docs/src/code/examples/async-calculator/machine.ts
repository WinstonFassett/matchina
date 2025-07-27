import { createPromiseMachine, withReset } from "matchina";

export function createAsyncCalculatorMachine() {
  const baseMachine = createPromiseMachine(
    (a: number, b: number) =>
      new Promise<number>((resolve) => setTimeout(() => resolve(a + b), 1000))
  );
  return withReset(baseMachine, baseMachine.states.Idle());
}

export type AsyncCalculatorMachine = ReturnType<
  typeof createAsyncCalculatorMachine
>;
