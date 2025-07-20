import { useState } from "react";
import { AsyncCalculatorView } from "./AsyncCalculatorView";
import { createAsyncCalculatorMachine } from "./machine";

export function AsyncCalculator() {
  const [calculator] = useState(() => createAsyncCalculatorMachine());
  return <AsyncCalculatorView machine={calculator} />;
}
