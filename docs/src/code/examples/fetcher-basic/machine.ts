import { createPromiseMachine } from "matchina";

// Function to create a promise machine for basic fetching
export function createBasicFetcherMachine() {
  return createPromiseMachine(async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  });
}
