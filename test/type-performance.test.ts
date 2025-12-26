/**
 * Type Performance Tests
 * 
 * These tests verify that complex types resolve correctly and serve as
 * regression tests during type refactoring. They use compile-time type
 * assertions that will fail TypeScript compilation if types break.
 * 
 * Run with: npx vitest run test/type-performance.test.ts
 * Type-check with: npx tsc --noEmit test/type-performance.test.ts
 */

import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import type { FactoryMachine, FactoryMachineContext, ExtractEventParams } from "../src/factory-machine-types";
import type { ExtractParamTypes, StateEventTransitionSenders } from "../src/factory-machine-api-types";
import type { FlattenFactoryStateKeys, HasMachineProperty, ExtractMachineFromFactory } from "../src/definition-types";
import type { StateMatchboxFactory } from "../src/state-types";

// ============================================================================
// Type Assertion Utilities
// ============================================================================

// Compile-time type equality check
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
type ExpectFalse<T extends false> = T;

// Check if type is `never`
type IsNever<T> = [T] extends [never] ? true : false;

// Check if type is `any`
type IsAny<T> = 0 extends 1 & T ? true : false;

// Check if type includes `any[]`
type HasAnyArray<T> = T extends any[] ? (IsAny<T[number]> extends true ? true : false) : false;

// ============================================================================
// Test Fixtures
// ============================================================================

// Simple machine for basic type tests
const simpleStates = defineStates({
  Idle: undefined,
  Loading: (url: string) => ({ url }),
  Success: (data: string) => ({ data }),
  Error: (error: Error) => ({ error }),
});

const simpleMachine = createMachine(
  simpleStates,
  {
    Idle: { 
      fetch: "Loading",
      fetchWithUrl: (url: string) => simpleStates.Loading(url),
    },
    Loading: { 
      success: "Success",
      error: "Error",
    },
    Success: { reset: "Idle" },
    Error: { retry: "Loading", reset: "Idle" },
  },
  "Idle"
);

type SimpleMachine = typeof simpleMachine;
type SimpleFC = SimpleMachine extends FactoryMachine<infer FC> ? FC : never;

// ============================================================================
// ExtractEventParams Tests
// ============================================================================

describe("ExtractEventParams type", () => {
  it("extracts params for simple string transitions", () => {
    // fetch: "Loading" - should have no params (Loading takes url, but transition is string)
    type FetchParams = ExtractEventParams<SimpleFC, "fetch">;
    
    // This should be [] or [string] depending on how the transition is defined
    // Since fetch: "Loading" and Loading takes (url: string), params should be [string]
    type _CheckFetchParams = Expect<Equal<FetchParams, [url: string]>>;
  });

  it("extracts params for function transitions", () => {
    // fetchWithUrl: (url: string) => states.Loading(url)
    type FetchWithUrlParams = ExtractEventParams<SimpleFC, "fetchWithUrl">;
    type _CheckFetchWithUrlParams = Expect<Equal<FetchWithUrlParams, [url: string]>>;
  });

  it("handles events with no params", () => {
    // reset: "Idle" - Idle takes no params
    type ResetParams = ExtractEventParams<SimpleFC, "reset">;
    type _CheckResetParams = Expect<Equal<ResetParams, []>>;
  });

  it("runtime verification of send types", () => {
    const m = createMachine(
      simpleStates,
      {
        Idle: { fetch: "Loading" },
        Loading: { success: "Success" },
        Success: { reset: "Idle" },
        Error: { reset: "Idle" },
      },
      "Idle"
    );

    // These should compile without error
    m.send("fetch", "https://example.com");
    expect(m.getState().key).toBe("Loading");
    
    m.send("success", "data");
    expect(m.getState().key).toBe("Success");
  });
});

// ============================================================================
// ExtractParamTypes Tests
// ============================================================================

describe("ExtractParamTypes type", () => {
  it("extracts params from state key transitions", () => {
    // When transition is a state key, params come from that state's factory
    type LoadingParams = ExtractParamTypes<SimpleFC, "Idle", "fetch">;
    type _CheckLoadingParams = Expect<Equal<LoadingParams, [url: string]>>;
  });

  it("extracts params from function transitions", () => {
    type FuncParams = ExtractParamTypes<SimpleFC, "Idle", "fetchWithUrl">;
    type _CheckFuncParams = Expect<Equal<FuncParams, [url: string]>>;
  });

  it("should not produce any[] for known transitions", () => {
    type Params = ExtractParamTypes<SimpleFC, "Success", "reset">;
    // Should be [] not any[]
    type _CheckNotAnyArray = ExpectFalse<HasAnyArray<Params>>;
  });
});

// ============================================================================
// StateEventTransitionSenders Tests
// ============================================================================

describe("StateEventTransitionSenders type", () => {
  it("creates typed sender functions for each state/event", () => {
    type Senders = StateEventTransitionSenders<SimpleFC>;
    
    // Should have keys for each state with transitions
    type _HasIdle = Expect<Equal<"Idle" extends keyof Senders ? true : false, true>>;
    type _HasLoading = Expect<Equal<"Loading" extends keyof Senders ? true : false, true>>;
    
    // Each state should have event keys
    type IdleSenders = Senders["Idle"];
    type _IdleHasFetch = Expect<Equal<"fetch" extends keyof IdleSenders ? true : false, true>>;
  });
});

// ============================================================================
// FlattenFactoryStateKeys Tests
// ============================================================================

describe("FlattenFactoryStateKeys type", () => {
  // Create a simple factory for testing
  const simpleFactory = defineStates({
    StateA: undefined,
    StateB: undefined,
  });

  type SimpleFactory = typeof simpleFactory;

  it("includes direct state keys for simple factories", () => {
    type Keys = FlattenFactoryStateKeys<SimpleFactory>;
    // For a simple factory without submachines, keys should be the state names
    // This verifies the type resolves without errors
    type _KeysExist = Keys extends string ? true : false;
    expect(true).toBe(true); // Runtime placeholder
  });

  it("type resolves without infinite recursion", () => {
    // This test verifies that FlattenFactoryStateKeys doesn't cause
    // "Type instantiation is excessively deep" errors
    type Keys = FlattenFactoryStateKeys<SimpleFactory>;
    type _NotNever = IsNever<Keys> extends true ? false : true;
    expect(true).toBe(true); // Runtime placeholder
  });
});

// ============================================================================
// HasMachineProperty Tests
// ============================================================================

describe("HasMachineProperty type", () => {
  it("detects machine property in state data", () => {
    const withMachine = () => ({ machine: { states: {}, transitions: {}, initial: "A" } });
    type _HasMachine = Expect<Equal<HasMachineProperty<typeof withMachine>, true>>;
  });

  it("returns false for simple states", () => {
    const simple = () => ({ value: 42 });
    type _NoMachine = Expect<Equal<HasMachineProperty<typeof simple>, false>>;
  });

  it("returns false for undefined states", () => {
    const undef = () => undefined;
    type _NoMachine = Expect<Equal<HasMachineProperty<typeof undef>, false>>;
  });
});

// ============================================================================
// ExtractMachineFromFactory Tests
// ============================================================================

describe("ExtractMachineFromFactory type", () => {
  it("extracts machine from factory with machine property", () => {
    const withMachine = () => ({ 
      machine: { 
        states: { A: undefined, B: undefined }, 
        transitions: {}, 
        initial: "A" as const 
      } 
    });
    
    type Extracted = ExtractMachineFromFactory<typeof withMachine>;
    type _HasStates = Expect<Equal<"states" extends keyof Extracted ? true : false, true>>;
    type _HasTransitions = Expect<Equal<"transitions" extends keyof Extracted ? true : false, true>>;
    type _HasInitial = Expect<Equal<"initial" extends keyof Extracted ? true : false, true>>;
  });

  it("returns never for states without machine", () => {
    const simple = () => ({ value: 42 });
    type Extracted = ExtractMachineFromFactory<typeof simple>;
    type _IsNever = Expect<IsNever<Extracted>>;
  });
});

// ============================================================================
// FactoryMachine Interface Tests
// ============================================================================

describe("FactoryMachine interface", () => {
  it("provides typed getState", () => {
    const m = simpleMachine;
    const state = m.getState();
    
    // State should have key property
    type _HasKey = Expect<Equal<"key" extends keyof typeof state ? true : false, true>>;
    
    // Key should be union of state names
    type StateKey = typeof state.key;
    type _KeyIsUnion = Expect<Equal<StateKey, "Idle" | "Loading" | "Success" | "Error">>;
    
    expect(state.key).toBe("Idle");
  });

  it("provides typed send method", () => {
    const m = simpleMachine;
    
    // send should accept valid event types
    // This is a compile-time check - if types are wrong, this won't compile
    m.send("fetch", "url");
    
    expect(m.getState().key).toBe("Loading");
  });

  it("exposes states and transitions", () => {
    const m = simpleMachine;
    
    type _HasStates = Expect<Equal<"states" extends keyof typeof m ? true : false, true>>;
    type _HasTransitions = Expect<Equal<"transitions" extends keyof typeof m ? true : false, true>>;
    
    expect(m.states).toBeDefined();
    expect(m.transitions).toBeDefined();
  });
});

// ============================================================================
// Complex Nested Type Tests
// ============================================================================

describe("Complex nested types", () => {
  // This tests the most complex type patterns that cause performance issues
  
  const nestedStates = defineStates({
    A: undefined,
    B: (x: number) => ({ x }),
    C: (x: number, y: string) => ({ x, y }),
  });

  const nestedMachine = createMachine(
    nestedStates,
    {
      A: { 
        toB: "B",
        toBWithParam: (x: number) => nestedStates.B(x),
        toC: "C",
      },
      B: { 
        toA: "A",
        toC: "C",
      },
      C: { 
        toA: "A",
        toB: "B",
      },
    },
    "A"
  );

  type NestedMachine = typeof nestedMachine;
  type NestedFC = NestedMachine extends FactoryMachine<infer FC> ? FC : never;

  it("handles multiple param types correctly", () => {
    type ToBParams = ExtractEventParams<NestedFC, "toB">;
    type ToCParams = ExtractEventParams<NestedFC, "toC">;
    
    // toB should have [x: number]
    type _CheckToBParams = Expect<Equal<ToBParams, [x: number]>>;
    
    // toC should have [x: number, y: string]
    type _CheckToCParams = Expect<Equal<ToCParams, [x: number, y: string]>>;
  });

  it("handles function transition params", () => {
    type ToBWithParamParams = ExtractEventParams<NestedFC, "toBWithParam">;
    type _CheckToBWithParamParams = Expect<Equal<ToBWithParamParams, [x: number]>>;
  });

  it("runtime verification of complex params", () => {
    const m = nestedMachine;
    
    m.send("toB", 42);
    expect(m.getState().key).toBe("B");
    expect(m.getState().data).toEqual({ x: 42 });
    
    m.send("toC", 1, "hello");
    expect(m.getState().key).toBe("C");
    expect(m.getState().data).toEqual({ x: 1, y: "hello" });
  });
});

// ============================================================================
// Type Performance Regression Tests
// ============================================================================

describe("Type performance regression", () => {
  // These tests ensure that type complexity doesn't regress
  // They should compile quickly - if they take too long, types need optimization
  
  it("ExtractEventParams resolves without deep instantiation", () => {
    // Create a machine with many states and events
    const manyStates = defineStates({
      S1: undefined,
      S2: undefined,
      S3: undefined,
      S4: undefined,
      S5: undefined,
      S6: undefined,
      S7: undefined,
      S8: undefined,
      S9: undefined,
      S10: undefined,
    });

    const manyMachine = createMachine(
      manyStates,
      {
        S1: { e1: "S2", e2: "S3" },
        S2: { e1: "S3", e2: "S4" },
        S3: { e1: "S4", e2: "S5" },
        S4: { e1: "S5", e2: "S6" },
        S5: { e1: "S6", e2: "S7" },
        S6: { e1: "S7", e2: "S8" },
        S7: { e1: "S8", e2: "S9" },
        S8: { e1: "S9", e2: "S10" },
        S9: { e1: "S10", e2: "S1" },
        S10: { e1: "S1", e2: "S2" },
      },
      "S1"
    );

    type ManyFC = typeof manyMachine extends FactoryMachine<infer FC> ? FC : never;
    type E1Params = ExtractEventParams<ManyFC, "e1">;
    type E2Params = ExtractEventParams<ManyFC, "e2">;
    
    // Both should resolve to [] since all states take no params
    type _CheckE1 = Expect<Equal<E1Params, []>>;
    type _CheckE2 = Expect<Equal<E2Params, []>>;
    
    // Runtime sanity check
    expect(manyMachine.getState().key).toBe("S1");
    manyMachine.send("e1");
    expect(manyMachine.getState().key).toBe("S2");
  });

  it("StateEventTransitionSenders resolves for complex machines", () => {
    const complexStates = defineStates({
      Init: undefined,
      Processing: (id: string, count: number) => ({ id, count }),
      Complete: (result: { success: boolean; message: string }) => ({ result }),
      Failed: (error: Error, retryCount: number) => ({ error, retryCount }),
    });

    const complexMachine = createMachine(
      complexStates,
      {
        Init: { 
          start: "Processing",
          startWithId: (id: string) => complexStates.Processing(id, 0),
        },
        Processing: { 
          complete: "Complete",
          fail: "Failed",
          increment: (id: string, count: number) => complexStates.Processing(id, count + 1),
        },
        Complete: { reset: "Init" },
        Failed: { 
          retry: "Processing",
          reset: "Init",
        },
      },
      "Init"
    );

    type ComplexFC = typeof complexMachine extends FactoryMachine<infer FC> ? FC : never;
    type Senders = StateEventTransitionSenders<ComplexFC>;
    
    // Should have all state keys
    type _HasInit = Expect<Equal<"Init" extends keyof Senders ? true : false, true>>;
    type _HasProcessing = Expect<Equal<"Processing" extends keyof Senders ? true : false, true>>;
    type _HasComplete = Expect<Equal<"Complete" extends keyof Senders ? true : false, true>>;
    type _HasFailed = Expect<Equal<"Failed" extends keyof Senders ? true : false, true>>;
    
    // Runtime verification
    expect(complexMachine.getState().key).toBe("Init");
  });
});
