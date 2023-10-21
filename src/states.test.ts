import { describe, it, expect, beforeEach } from "vitest";
import { createStates } from "./states";

describe("createStates", () => {
  const config = {
    Idle: undefined,
    Loading: { id: 1 },
    Loaded: (data: string) => ({ data }),
    Error: (error: string) => ({ error }),
  } as const;
  let states: ReturnType<typeof createStates<typeof config>>;

  beforeEach(() => {
    states = createStates(config);
  });

  it("should have keys that match the config", () => {
    expect(Object.keys(states)).toEqual(
      Object.keys({
        Idle: undefined,
        Loading: undefined,
        Loaded: undefined,
        Error: undefined,
      }),
    );
  });
  describe("populates data from config", () => {
    it("undefined -> {}", () => {
      const idleState = states.Idle();
      expect(idleState.state).toBe("Idle");
      expect(idleState.data).toEqual({});
    });

    it("object -> object", () => {
      const loadingState = states.Loading();
      expect(loadingState.state).toBe("Loading");
      expect(loadingState.data.id).toBe(1);
      expect(loadingState.data).toBe(config.Loading);
    });

    it("function -> function(...params) => data ", () => {
      const loadedState = states.Loaded("hello");
      expect(loadedState.state).toBe("Loaded");
      expect(loadedState.data.data).toBe("hello");

      const errorState = states.Error("oops");
      expect(errorState.state).toBe("Error");
      expect(errorState.data.error).toBe("oops");
    });
  });
});
