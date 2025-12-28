import { describe, it, expect } from 'vitest';
import { defineStates } from '../src/define-states';
import { createMachine } from '../src/factory-machine';
import { buildFlattenedShape, buildHierarchicalShape } from '../src/nesting/shape-builders';

describe('shape-builders simple coverage', () => {
  it('should build flattened shape from simple machine', () => {
    const states = defineStates({
      Idle: () => ({ key: 'Idle' }),
      Active: () => ({ key: 'Active' }),
    });
    const machine = createMachine(states, {
      Idle: { start: () => states.Active() },
      Active: { stop: () => states.Idle() },
    }, 'Idle');
    
    const shape = buildFlattenedShape(machine.transitions as any, 'Idle');
    
    expect(shape).toBeDefined();
    expect(shape.states).toBeDefined();
    expect(shape.states.has('Idle')).toBe(true);
    expect(shape.states.has('Active')).toBe(true);
    expect(shape.type).toBe('flattened');
    expect(shape.initialKey).toBe('Idle');
  });

  it('should build hierarchical shape from nested machine', () => {
    const childStates = defineStates({
      Idle: () => ({ key: 'Child.Idle' }),
      Active: () => ({ key: 'Child.Active' }),
    });
    const childMachine = createMachine(childStates, {
      Idle: { start: () => childStates.Active() },
      Active: { stop: () => childStates.Idle() },
    }, 'Idle');

    const parentStates = defineStates({
      Idle: () => ({ key: 'Parent.Idle', machine: childMachine }),
      Active: () => ({ key: 'Parent.Active' }),
    });
    const parentMachine = createMachine(parentStates, {
      Idle: { activate: () => parentStates.Active() },
      Active: { deactivate: () => parentStates.Idle() },
    }, 'Idle');
    
    const shape = buildHierarchicalShape(parentMachine);
    
    expect(shape).toBeDefined();
    expect(shape.states).toBeDefined();
    expect(shape.type).toBe('nested');
  });
});
