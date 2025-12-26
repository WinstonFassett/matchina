import { describe, it, expect } from 'vitest';
import { createMachine } from '../src/factory-machine';
import { defineStates } from '../src/define-states';
import { withEventApi } from '../src/extras/with-event-api';

describe('FactoryMachine.extend()', () => {
  const states = defineStates({
    On: () => ({ label: 'On' }),
    Off: () => ({ label: 'Off' }),
  });

  const transitions = {
    On: { toggle: () => states.Off() },
    Off: { toggle: () => states.On() },
  };

  it('should extend machine with additional functionality', () => {
    const machine = createMachine(states, transitions, 'Off');
    
    const withCustomLogic = (m: typeof machine) => ({
      isOn: () => m.getState().key === 'On',
      customToggle: () => {
        m.send('toggle');
        return 'toggled';
      },
    });

    const enhanced = machine.extend(withCustomLogic);

    // Original functionality should still work
    expect(enhanced.getState().key).toBe('Off');
    enhanced.send('toggle');
    expect(enhanced.getState().key).toBe('On');

    // Extended functionality should work
    expect(enhanced.isOn()).toBe(true);
    expect(enhanced.customToggle()).toBe('toggled');
    expect(enhanced.getState().key).toBe('Off');
  });

  it('should work with withEventApi extension', () => {
    const machine = createMachine(states, transitions, 'Off');
    const enhanced = machine.extend(withEventApi);

    // Original send method should work
    expect(enhanced.getState().key).toBe('Off');
    enhanced.send('toggle');
    expect(enhanced.getState().key).toBe('On');

    // Event API methods should be available
    expect(typeof (enhanced as any).toggle).toBe('function');
    (enhanced as any).toggle();
    expect(enhanced.getState().key).toBe('Off');
  });

  it('should support chaining multiple extensions', () => {
    const machine = createMachine(states, transitions, 'Off');
    
    const withLogger = (m: typeof machine) => ({
      logState: () => console.log(`Current state: ${m.getState().key}`),
    });

    const withReset = (m: typeof machine) => ({
      reset: () => {
        // Force back to Off state
        while (m.getState().key !== 'Off') {
          m.send('toggle');
        }
      },
    });

    const enhanced = machine
      .extend(withEventApi)
      .extend(withLogger)
      .extend(withReset);

    // Test all extensions work together
    expect(typeof (enhanced as any).toggle).toBe('function');
    expect(typeof (enhanced as any).logState).toBe('function');
    expect(typeof (enhanced as any).reset).toBe('function');

    (enhanced as any).toggle();
    expect(enhanced.getState().key).toBe('On');
    
    (enhanced as any).reset();
    expect(enhanced.getState().key).toBe('Off');
  });

  it('should preserve type safety', () => {
    const machine = createMachine(states, transitions, 'Off');
    
    const withTypedExtension = (m: typeof machine) => ({
      getStateKey: (): 'On' | 'Off' => m.getState().key as 'On' | 'Off',
      sendTypedEvent: (event: 'toggle') => m.send(event),
    });

    const enhanced = machine.extend(withTypedExtension);
    
    // TypeScript should enforce these types
    const stateKey: 'On' | 'Off' = enhanced.getStateKey();
    expect(stateKey).toBe('Off');
    
    enhanced.sendTypedEvent('toggle');
    expect(enhanced.getState().key).toBe('On');
  });

  it('should work with complex state machines', () => {
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
        retry: () => (ev: any) => (ev as any).from,
      },
      Success: { search: (query: string) => (ev: any) => complexStates.Loading(query) },
      Error: { search: (query: string) => (ev: any) => complexStates.Loading(query) },
    };

    const machine = createMachine(complexStates, complexTransitions, 'Idle');
    const enhanced = machine.extend(withEventApi);

    // Test complex event API
    expect(typeof (enhanced as any).search).toBe('function');
    (enhanced as any).search('test');
    expect(enhanced.getState().key).toBe('Loading');
    
    (enhanced as any).success(['result1', 'result2']);
    expect(enhanced.getState().key).toBe('Success');
    expect(enhanced.getState().data.results).toEqual(['result1', 'result2']);
  });
});
