import { createMachine, createPromiseMachine } from "@lib/src";
import { useState, useEffect } from "react";

export function useFetcher(url: string, options: RequestInit = {}) {
  const [machine] = useState(() =>
    createPromiseMachine(async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    }),
  );
  console.log({ machine, url, options });
}
