/**
 * Type Correctness Tests
 * 
 * These are compile-time regression tests. If any type assertion fails,
 * TypeScript will error during `tsc --noEmit` or in the IDE.
 * 
 * The runtime tests are trivial - the real value is the compile-time checks.
 * 
 * Run: npx tsc --noEmit test/type-correctness.test.ts
 * Or:  npx vitest run test/type-correctness.test.ts
 */

import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import type { FactoryMachine } from "../src/factory-machine-types";

// ============================================================================
// Type Assertion Helpers
// ============================================================================

// These cause compile errors if types don't match
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
type ExpectExtends<A, B> = A extends B ? true : false;

// ============================================================================
// Fixture: Standard Machine
// ============================================================================

const states = defineStates({
  Idle: undefined,
  Loading: (url: string) => ({ url }),
  Success: (data: { items: string[] }) => ({ data }),
  Error: (error: Error, retryCount: number) => ({ error, retryCount }),
});

const machine = createMachine(
  states,
  {
    Idle: { 
      fetch: "Loading",
    },
    Loading: { 
      success: "Success",
      error: "Error",
    },
    Success: { 
      reset: "Idle",
      refetch: "Loading",
    },
    Error: { 
      retry: "Loading",
      reset: "Idle",
    },
  },
  "Idle"
);

// ============================================================================
// 1. State Key Types
// ============================================================================

describe("State key types", () => {
  it("getState().key is union of state names", () => {
    const state = machine.getState();
    
    // Compile-time: key must be one of the defined states
    type StateKey = typeof state.key;
    type _Check = Expect<Equal<StateKey, "Idle" | "Loading" | "Success" | "Error">>;
    
    // Runtime sanity
    expect(["Idle", "Loading", "Success", "Error"]).toContain(state.key);
  });

  it("state.is() narrows correctly", () => {
    const state = machine.getState();
    
    if (state.is("Loading")) {
      // After is() check, data should be typed
      // Compile-time check: accessing .url should work
      const _url = state.data.url;
      void _url;
    }
    
    expect(state.is("Idle")).toBe(true);
  });

  it("state.as() returns typed state when matching", () => {
    // Create fresh machine
    const m = createMachine(states, machine.transitions, "Idle");
    m.send("fetch", "url");
    const state = m.getState();
    
    // as() returns the state when it matches
    const loading = state.as("Loading");
    expect(loading).toBeDefined();
    expect(loading?.data.url).toBe("url");
  });
});

// ============================================================================
// 2. State Data Types
// ============================================================================

describe("State data types", () => {
  it("Loading state has url in data", () => {
    machine.send("fetch", "https://example.com");
    const state = machine.getState();
    
    if (state.is("Loading")) {
      // Compile-time: data.url should be string
      const url: string = state.data.url;
      expect(url).toBe("https://example.com");
    }
  });

  it("Success state has data with items", () => {
    // Reset and go to success
    const m = createMachine(states, machine.transitions, "Idle");
    m.send("fetch", "url");
    m.send("success", { items: ["a", "b"] });
    
    const state = m.getState();
    if (state.is("Success")) {
      // Compile-time: data.data.items should be string[]
      const items: string[] = state.data.data.items;
      expect(items).toEqual(["a", "b"]);
    }
  });

  it("Error state has error and retryCount", () => {
    const m = createMachine(states, machine.transitions, "Idle");
    m.send("fetch", "url");
    m.send("error", new Error("fail"), 3);
    
    const state = m.getState();
    if (state.is("Error")) {
      // Compile-time: data should have error and retryCount
      const err: Error = state.data.error;
      const count: number = state.data.retryCount;
      expect(err.message).toBe("fail");
      expect(count).toBe(3);
    }
  });
});

// ============================================================================
// 3. Send Method Types
// ============================================================================

describe("send() method types", () => {
  it("send accepts valid event names", () => {
    const m = createMachine(states, machine.transitions, "Idle");
    
    // These should all compile without error
    m.send("fetch", "url");
    m.send("success", { items: [] });
    m.send("reset");
    
    expect(true).toBe(true);
  });

  it("send requires correct params for target state", () => {
    const m = createMachine(states, machine.transitions, "Idle");
    
    // fetch -> Loading requires (url: string)
    m.send("fetch", "https://example.com");
    expect(m.getState().key).toBe("Loading");
    
    // success -> Success requires (data: { items: string[] })
    m.send("success", { items: ["item1"] });
    expect(m.getState().key).toBe("Success");
    
    // reset -> Idle requires no params
    m.send("reset");
    expect(m.getState().key).toBe("Idle");
  });

  it("send with multi-param state", () => {
    const m = createMachine(states, machine.transitions, "Idle");
    m.send("fetch", "url");
    
    // error -> Error requires (error: Error, retryCount: number)
    m.send("error", new Error("oops"), 1);
    expect(m.getState().key).toBe("Error");
    
    const state = m.getState();
    if (state.is("Error")) {
      expect(state.data.retryCount).toBe(1);
    }
  });
});

// ============================================================================
// 4. Transition Types
// ============================================================================

describe("Transition types", () => {
  it("machine.transitions has correct structure", () => {
    type Transitions = typeof machine.transitions;
    
    // Should have keys for states with transitions
    type _HasIdle = Expect<ExpectExtends<"Idle", keyof Transitions>>;
    type _HasLoading = Expect<ExpectExtends<"Loading", keyof Transitions>>;
    type _HasSuccess = Expect<ExpectExtends<"Success", keyof Transitions>>;
    type _HasError = Expect<ExpectExtends<"Error", keyof Transitions>>;
    
    expect(machine.transitions).toBeDefined();
  });

  it("each state has its event keys", () => {
    type Transitions = typeof machine.transitions;
    
    // Idle should have fetch
    type IdleEvents = keyof NonNullable<Transitions["Idle"]>;
    type _IdleHasFetch = Expect<ExpectExtends<"fetch", IdleEvents>>;
    
    // Loading should have success and error
    type LoadingEvents = keyof NonNullable<Transitions["Loading"]>;
    type _LoadingHasSuccess = Expect<ExpectExtends<"success", LoadingEvents>>;
    type _LoadingHasError = Expect<ExpectExtends<"error", LoadingEvents>>;
    
    expect(true).toBe(true);
  });
});

// ============================================================================
// 5. Machine Interface Types
// ============================================================================

describe("Machine interface types", () => {
  it("machine has states property", () => {
    type States = typeof machine.states;
    
    // states should have factory functions for each state
    type _HasIdle = Expect<ExpectExtends<"Idle", keyof States>>;
    type _HasLoading = Expect<ExpectExtends<"Loading", keyof States>>;
    
    expect(machine.states.Idle).toBeTypeOf("function");
    expect(machine.states.Loading).toBeTypeOf("function");
  });

  it("machine.states factories return correct types", () => {
    const idle = machine.states.Idle();
    const loading = machine.states.Loading("url");
    
    // Compile-time: factories return states with correct keys
    type _IdleKey = Expect<Equal<typeof idle.key, "Idle">>;
    type _LoadingKey = Expect<Equal<typeof loading.key, "Loading">>;
    
    expect(idle.key).toBe("Idle");
    expect(loading.key).toBe("Loading");
    expect(loading.data.url).toBe("url");
  });

  it("machine implements FactoryMachine interface", () => {
    // Compile-time: machine should be assignable to FactoryMachine
    type _IsFactoryMachine = Expect<ExpectExtends<typeof machine, FactoryMachine<any>>>;
    
    expect(true).toBe(true);
  });
});

// ============================================================================
// 6. Function Transition Types
// ============================================================================

describe("Function transition types", () => {
  const statesWithFn = defineStates({
    A: undefined,
    B: (x: number) => ({ x }),
  });

  const machineWithFn = createMachine(
    statesWithFn,
    {
      A: { 
        // Direct state key
        toB: "B",
        // Function returning state
        toBWithDouble: (x: number) => statesWithFn.B(x * 2),
      },
      B: { 
        toA: "A",
      },
    },
    "A"
  );

  it("function transitions work with params", () => {
    machineWithFn.send("toBWithDouble", 5);
    
    const state = machineWithFn.getState();
    if (state.is("B")) {
      expect(state.data.x).toBe(10);
    }
  });

  it("string transitions pass params to target state", () => {
    const m = createMachine(statesWithFn, machineWithFn.transitions, "A");
    m.send("toB", 42);
    
    const state = m.getState();
    if (state.is("B")) {
      expect(state.data.x).toBe(42);
    }
  });
});

// ============================================================================
// 7. Curried Transition Types
// ============================================================================

describe("Curried transition types", () => {
  it("curried transitions compile correctly", () => {
    const statesWithCurried = defineStates({
      A: (count: number) => ({ count }),
      B: undefined,
    });

    // This verifies the curried transition pattern compiles
    const _machineWithCurried = createMachine(
      statesWithCurried,
      {
        A: { 
          // Curried transition: (params) => (event) => state
          increment: () => (ev: any) => statesWithCurried.A(ev.from.data.count + 1),
          toB: "B",
        },
        B: { 
          toA: () => statesWithCurried.A(0),
        },
      },
      "B" // Start in B (no params required)
    );
    
    expect(true).toBe(true);
  });
});

// ============================================================================
// 8. Match API Types
// ============================================================================

describe("match() API types", () => {
  it("state.match() requires handlers for all states", () => {
    // Create fresh machine in Idle state
    const m = createMachine(states, machine.transitions, "Idle");
    const state = m.getState();
    
    // Compile-time: match requires all state handlers
    const result = state.match({
      Idle: () => "idle",
      Loading: (s) => `loading ${s.url}`,
      Success: (s) => `success ${s.data.items.length}`,
      Error: (s) => `error ${s.error.message}`,
    });
    
    expect(result).toBe("idle");
  });

  it("state.match() handler receives typed data", () => {
    // Create fresh machine for this test
    const m = createMachine(states, machine.transitions, "Idle");
    m.send("fetch", "test-url");
    const state = m.getState();
    
    const result = state.match({
      Idle: () => null,
      Loading: (s) => {
        // Compile-time: s should have url property
        const url: string = s.url;
        return url;
      },
      Success: () => null,
      Error: () => null,
    });
    
    expect(result).toBe("test-url");
  });
});

// ============================================================================
// 9. Edge Cases
// ============================================================================

describe("Edge cases", () => {
  it("undefined state data works", () => {
    const simpleStates = defineStates({
      On: undefined,
      Off: undefined,
    });
    
    const toggle = createMachine(
      simpleStates,
      {
        On: { toggle: "Off" },
        Off: { toggle: "On" },
      },
      "Off"
    );
    
    // send with no params for undefined states
    toggle.send("toggle");
    expect(toggle.getState().key).toBe("On");
    
    toggle.send("toggle");
    expect(toggle.getState().key).toBe("Off");
  });

  it("optional params work", () => {
    const optStates = defineStates({
      A: (x?: number) => ({ x: x ?? 0 }),
      B: undefined,
    });
    
    const m = createMachine(
      optStates,
      {
        A: { toB: "B" },
        B: { toA: (x?: number) => optStates.A(x) },
      },
      "B"
    );
    
    // Can call with or without param via function transition
    m.send("toA"); // No param - uses default
    expect(m.getState().key).toBe("A");
    
    m.send("toB");
    m.send("toA", 5); // With param
    expect(m.getState().key).toBe("A");
  });
});
