import { useMachine } from "matchina/react";
import { useMemo, useState, useCallback } from "react";
import { createPromiseFetcherMachine } from "./machine";

export function usePromiseFetcher() {
  const [machineId, setMachineId] = useState(0);

  const fetcher = useMemo(() => createPromiseFetcherMachine(), [machineId]);
  useMachine(fetcher);

  const reset = useCallback(() => {
    setMachineId((id) => id + 1);
  }, []);

  return { machine: fetcher, reset };
}
