import { useMemo } from "react";
import { useMachine } from "matchina/react";
import { createFetcher } from "./machine";

export const useAdvancedFetcher = (
  url = "https://httpbin.org/delay/1",
  options = {
    method: "GET",
    maxTries: 5,
    timeout: 2000,
    autoretry: true,
  },
) => {
  const { method, maxTries, timeout, autoretry } = options;
  const fetcher = useMemo(() => {
    return createFetcher(url, options);
  }, [url, method, maxTries, timeout, autoretry]);

  useMachine(fetcher);

  return fetcher;
};
