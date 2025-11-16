import { describe, it, expect } from 'vitest';
import { defineStates } from '../../define-states';
import { matchina } from '../../matchina';
import { createHierarchicalMachine } from '../propagateSubmachines';

describe('propagateSubmachines bubbling', () => {
  it('bubbles to root when branded child has no matching transition (factory child)', () => {
    // Child machine with no `close` transition
    const childStates = defineStates({
      Empty: () => ({}),
      TextEntry: (text: string = '') => ({ text }),
    });
    const child = matchina(childStates, {
      Empty: { typed: 'TextEntry' },
      TextEntry: { typed: (t: string) => childStates.TextEntry(t) },
    }, childStates.Empty());

    // Root machine with `close` at the parent level
    const rootStates = defineStates({
      Inactive: () => ({}),
      Active: (machine: any) => ({ machine }),
    });

    const root = matchina({
      ...rootStates,
      Active: () => rootStates.Active(child),
    }, {
      Inactive: { focus: 'Active' },
      Active: { close: 'Inactive' },
    }, rootStates.Inactive());

    const hierarchical = createHierarchicalMachine(root);

    // Move to Active (child is branded FactoryMachine)
    hierarchical.focus();
    expect(hierarchical.getState().key).toBe('Active');
    const activeChild = hierarchical.getState().data.machine;
    expect(activeChild?.getState?.().key).toBe('Empty');

    // Send `close` which child does not handle; should bubble and root should handle
    hierarchical.close();
    expect(hierarchical.getState().key).toBe('Inactive');
  });

  it('bubbles to root when duck-typed child send() does nothing (duck child)', () => {
    // Duck-typed child: has getState and send, but no transitions and send() is a no-op
    const duckState = { key: 'Empty', data: {} } as any;
    const duckChild = {
      getState: () => duckState,
      send: (_type: string, _params?: any) => undefined,
    } as any;

    // Root machine with `close` at the parent level
    const rootStates = defineStates({
      Inactive: () => ({}),
      Active: (machine: any) => ({ machine }),
    });

    const root = matchina({
      ...rootStates,
      Active: () => rootStates.Active(duckChild),
    }, {
      Inactive: { focus: 'Active' },
      Active: { close: 'Inactive' },
    }, rootStates.Inactive());

    const hierarchical = createHierarchicalMachine(root);

    // Move to Active (child is duck-typed)
    hierarchical.focus();
    expect(hierarchical.getState().key).toBe('Active');
    const activeDuck = hierarchical.getState().data.machine;
    expect(activeDuck?.getState?.().key).toBe('Empty');

    // Send `close` which duck child "handles" by doing nothing; should bubble to root
    hierarchical.close();
    expect(hierarchical.getState().key).toBe('Inactive');
  });
});
