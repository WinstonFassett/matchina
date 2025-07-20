import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { createAsyncCalculatorMachine } from "./machine";

export function useAsyncCalculator() {
  const calculator = useMemo(() => createAsyncCalculatorMachine(), []);
  return useMachine(calculator);
}
