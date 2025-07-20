import { useMachine } from "matchina/react";
import { useMemo } from "react";
import { createBasicFetcherMachine } from "./machine";

export function useFetcher() {
  const fetcher = useMemo(() => createBasicFetcherMachine(), []);
  return useMachine(fetcher);
}
