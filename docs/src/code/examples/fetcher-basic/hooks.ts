import { useMachine } from "matchina/react";
import { useMemo, useState, useCallback } from "react";
import { createBasicFetcherMachine } from "./machine";

export function useFetcher() {
  const [machineId, setMachineId] = useState(0);

  const fetcher = useMemo(() => createBasicFetcherMachine(), [machineId]);
  useMachine(fetcher);

  const reset = useCallback(() => {
    setMachineId((id) => id + 1);
  }, []);

  return { fetcher, reset };
}
