import { describe, it, expect } from 'vitest';
import { createMachine } from '../src/factory-machine';
import { defineStates } from '../src/define-states';
import { withEventApi } from '../src/extras/with-event-api';

// Type assertion helpers for compile-time testing
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
type ExpectExtends<A, B> = A extends B ? true : false;

describe('FactoryMachine.extend() - Type Tests', () => {
  const states = defineStates({
    On: () => ({ label: 'On' }),
    Off: () => ({ label: 'Off' }),
  });

  const transitions = {
    On: { toggle: () => states.Off() },
    Off: { toggle: () => states.On() },
  };

  it('should properly extend types with event API', () => {
    const machine = createMachine(states, transitions, 'Off');
    const enhanced = machine.extend(withEventApi);

    // Type test: enhanced should have toggle method
    type EnhancedType = typeof enhanced;
    type HasToggleMethod = 'toggle' extends keyof EnhancedType ? true : false;
    
    // Type test: enhanced should still have original methods
    type HasSendMethod = 'send' extends keyof EnhancedType ? true : false;
    type HasGetStateMethod = 'getState' extends keyof EnhancedType ? true : false;

    // Runtime tests
    expect(typeof (enhanced as any).toggle).toBe('function');
    expect(typeof enhanced.send).toBe('function');
    expect(typeof enhanced.getState).toBe('function');

    // These will cause compile errors if types are wrong
    type _Test1 = Expect<HasToggleMethod>;
    type _Test2 = Expect<HasSendMethod>;
    type _Test3 = Expect<HasGetStateMethod>;
  });

  it('should preserve original machine type while adding extension', () => {
    const machine = createMachine(states, transitions, 'Off');
    
    const withCustom = (m: typeof machine) => ({
      customMethod: () => 'custom',
      getStateKey: () => m.getState().key,
    });

    const extended = machine.extend(withCustom);

    // Type tests
    type ExtendedType = typeof extended;
    type HasCustomMethod = 'customMethod' extends keyof ExtendedType ? true : false;
    type HasGetStateKeyMethod = 'getStateKey' extends keyof ExtendedType ? true : false;
    type StillHasSendMethod = 'send' extends keyof ExtendedType ? true : false;

    // Runtime tests
    expect((extended as any).customMethod()).toBe('custom');
    expect((extended as any).getStateKey()).toBe('Off');
    expect(typeof extended.send).toBe('function');

    // Compile-time type assertions
    type _Test1 = Expect<HasCustomMethod>;
    type _Test2 = Expect<HasGetStateKeyMethod>;
    type _Test3 = Expect<StillHasSendMethod>;
  });

  it('should support chaining with proper type accumulation', () => {
    const machine = createMachine(states, transitions, 'Off');
    
    const withA = (m: typeof machine) => ({ methodA: () => 'A' });
    const withB = (m: typeof machine) => ({ methodB: () => 'B' });
    const withC = (m: typeof machine) => ({ methodC: () => 'C' });

    const chained = machine
      .extend(withEventApi)
      .extend(withA)
      .extend(withB)
      .extend(withC);

    // Type tests for accumulated methods
    type ChainedType = typeof chained;
    type HasToggle = 'toggle' extends keyof ChainedType ? true : false;
    type HasMethodA = 'methodA' extends keyof ChainedType ? true : false;
    type HasMethodB = 'methodB' extends keyof ChainedType ? true : false;
    type HasMethodC = 'methodC' extends keyof ChainedType ? true : false;
    type StillHasOriginal = 'send' extends keyof ChainedType ? true : false;

    // Runtime tests
    expect(typeof (chained as any).toggle).toBe('function');
    expect((chained as any).methodA()).toBe('A');
    expect((chained as any).methodB()).toBe('B');
    expect((chained as any).methodC()).toBe('C');
    expect(typeof chained.send).toBe('function');

    // Compile-time type assertions
    type _Test1 = Expect<HasToggle>;
    type _Test2 = Expect<HasMethodA>;
    type _Test3 = Expect<HasMethodB>;
    type _Test4 = Expect<HasMethodC>;
    type _Test5 = Expect<StillHasOriginal>;
  });

  it('should maintain proper type safety for method parameters', () => {
    const machine = createMachine(states, transitions, 'Off');
    
    const withTypedMethods = (m: typeof machine) => ({
      // Should only accept 'toggle' as event type
      sendToggle: (event: 'toggle') => m.send(event),
      // Should return proper state key type
      getCurrentState: (): 'On' | 'Off' => m.getState().key as 'On' | 'Off',
    });

    const typed = machine.extend(withTypedMethods);

    // Type tests
    type TypedType = typeof typed;
    type HasSendToggle = 'sendToggle' extends keyof TypedType ? true : false;
    type HasGetCurrentState = 'getCurrentState' extends keyof TypedType ? true : false;

    // Runtime tests
    expect((typed as any).getCurrentState()).toBe('Off'); // Initial state
    (typed as any).sendToggle('toggle');
    expect((typed as any).getCurrentState()).toBe('On'); // After toggle

    // Compile-time type assertions
    type _Test1 = Expect<HasSendToggle>;
    type _Test2 = Expect<HasGetCurrentState>;
  });

  it('should properly extend with complex event API', () => {
    const complexStates = defineStates({
      Idle: () => ({ attempts: 0 }),
      Loading: (query: string) => ({ query, attempts: 0 }),
      Success: (query: string, results: string[]) => ({ query, results }),
      Error: (query: string, error: string) => ({ query, error }),
    });

    const complexTransitions = {
      Idle: { search: (query: string) => (ev: any) => complexStates.Loading(query) },
      Loading: {
        success: (results: string[]) => (ev: any) => 
          complexStates.Success((ev as any).from.data.query, results),
        error: (error: string) => (ev: any) => 
          complexStates.Error((ev as any).from.data.query, error),
      },
      Success: { search: (query: string) => (ev: any) => complexStates.Loading(query) },
      Error: { search: (query: string) => (ev: any) => complexStates.Loading(query) },
    };

    const machine = createMachine(complexStates, complexTransitions, 'Idle');
    const enhanced = machine.extend(withEventApi);

    // Type tests for complex API
    type EnhancedType = typeof enhanced;
    type HasSearchMethod = 'search' extends keyof EnhancedType ? true : false;
    type HasSuccessMethod = 'success' extends keyof EnhancedType ? true : false;
    type HasErrorMethod = 'error' extends keyof EnhancedType ? true : false;

    // Runtime tests
    expect(typeof (enhanced as any).search).toBe('function');
    expect(typeof (enhanced as any).success).toBe('function');
    expect(typeof (enhanced as any).error).toBe('function');

    // Test actual functionality
    (enhanced as any).search('test');
    expect(enhanced.getState().key).toBe('Loading');
    
    (enhanced as any).success(['result1']);
    expect(enhanced.getState().key).toBe('Success');

    // Compile-time type assertions
    type _Test1 = Expect<HasSearchMethod>;
    type _Test2 = Expect<HasSuccessMethod>;
    type _Test3 = Expect<HasErrorMethod>;
  });
});
