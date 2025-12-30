import { createPromiseMachine, withReset } from "matchina";

export function createAsyncCalculatorMachine() {
  const baseMachine = createPromiseMachine(
    (a: number, b: number) =>
      new Promise<number>((resolve) => setTimeout(() => resolve(a + b), 1000))
  );
  
  // Debug: Check what states we actually have
  console.log("Promise machine states:", Object.keys(baseMachine.states));
  
  const resetMachine = withReset(baseMachine, baseMachine.states.Idle());
  
  // Debug: Check states after withReset
  console.log("Reset machine states:", Object.keys(resetMachine.states));
  
  return resetMachine;
}

export type AsyncCalculatorMachine = ReturnType<
  typeof createAsyncCalculatorMachine
>;
