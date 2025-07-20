import { useMemo } from "react";
import { useMachine } from "matchina/react";
import { createFetcher } from "./machine";

export const useAdvancedFetcher = (
  url = "https://httpbin.org/delay/1",
  options = {
    method: "GET",
    maxTries: 5,
    timeout: 1200,
    autoretry: true,
  },
) => {
  const fetcher = useMemo(() => {
    return createFetcher(url, options);
  }, [url]);

  useMachine(fetcher);

  return fetcher;
};
