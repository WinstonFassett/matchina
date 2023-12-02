import { describe, it, expect, beforeEach } from "vitest";
import { defineStates } from "../src/states";

describe("createStates", () => {
  const config = {
    Idle: undefined,
    Loading: { id: 1 },
    Loaded: (data: string) => ({ data }),
    Error: (error: string) => ({ error }),
  } as const;
  let states: ReturnType<typeof defineStates<typeof config>>;

  beforeEach(() => {
    states = defineStates(config);
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
      expect(idleState.key).toBe("Idle");
      expect(idleState.data).toEqual(undefined);
    });

    it("object -> object", () => {
      const loadingState = states.Loading();
      expect(loadingState.key).toBe("Loading");
      expect(loadingState.data.id).toBe(1);
      expect(loadingState.data).toBe(config.Loading);
    });

    it("function -> function(...params) => data ", () => {
      const loadedState = states.Loaded("hello");
      expect(loadedState.key).toBe("Loaded");
      expect(loadedState.data.data).toBe("hello");

      const errorState = states.Error("oops");
      expect(errorState.key).toBe("Error");
      expect(errorState.data.error).toBe("oops");
    });
  });
});
