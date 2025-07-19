import { useState, useEffect } from "react";
import { createPromiseMachine, promiseDelayedSum } from "./machine";

export const useSumFetcher = (defaultA = 5, defaultB = 7) => {
  const [a, setA] = useState(defaultA);
  const [b, setB] = useState(defaultB);
  const [adder] = useState(() => {
    const machine = createPromiseMachine(promiseDelayedSum);
    return {
      machine,
      state: machine.getState(),
    };
  });
  
  useEffect(() => {
    // Clean up any pending promises when component unmounts
    return () => {
      // In a real implementation, you might want to add abort capability
      // For this simple example, we don't need it
    };
  }, []);

  const calculate = () => {
    adder.machine.execute(a, b);
  };

  return {
    ...adder,
    a,
    b,
    setA,
    setB,
    calculate
  };
};
