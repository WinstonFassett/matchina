import { useState, useEffect } from "react";
import { createRPSMachine } from "./machine";

export const useRPSGame = () => {
  const [machine] = useState(() => createRPSMachine());

  // Optional cleanup if needed
  useEffect(() => {
    return () => {
      // Any cleanup code if needed
    };
  }, []);

  return machine;
};
