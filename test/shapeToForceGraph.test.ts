import { describe, it, expect } from 'vitest';
import { buildForceGraphData } from '../src/viz/ForceGraphInspector/utils/shapeToForceGraph';
import type { MachineShape } from '../src/hsm/shape-types';

// Helper to create a simple toggle machine shape
function createToggleShape(): MachineShape {
  const states = new Map([
    ['On', { key: 'On', fullKey: 'On', isFinal: false, isCompound: false }],
    ['Off', { key: 'Off', fullKey: 'Off', isFinal: false, isCompound: false }]
  ]);
  
  const transitions = new Map([
    ['On', new Map([['toggle', 'Off']])],
    ['Off', new Map([['toggle', 'On']])]
  ]);
  
  const hierarchy = new Map([
    ['On', undefined],
    ['Off', undefined]
  ]);

  return {
    states,
    transitions,
    hierarchy,
    initialKey: 'On'
  };
}

// Helper to create a hierarchical checkout machine shape
function createCheckoutShape(): MachineShape {
  const states = new Map([
    ['Cart', { key: 'Cart', fullKey: 'Cart', isFinal: false, isCompound: false }],
    ['Payment', { key: 'Payment', fullKey: 'Payment', isFinal: false, isCompound: true, initial: 'Pending' }],
    ['Payment.Pending', { key: 'Pending', fullKey: 'Payment.Pending', isFinal: false, isCompound: false }],
    ['Payment.Authorized', { key: 'Authorized', fullKey: 'Payment.Authorized', isFinal: false, isCompound: false }],
    ['Payment.Declined', { key: 'Declined', fullKey: 'Payment.Declined', isFinal: false, isCompound: false }],
    ['Confirmation', { key: 'Confirmation', fullKey: 'Confirmation', isFinal: false, isCompound: false }],
    ['Complete', { key: 'Complete', fullKey: 'Complete', isFinal: true, isCompound: false }]
  ]);
  
  const transitions = new Map([
    ['Cart', new Map([['checkout', 'Payment.Pending']])],
    ['Payment.Pending', new Map([
      ['authorize', 'Payment.Authorized'],
      ['decline', 'Payment.Declined'],
      ['cancel', 'Cart']
    ])],
    ['Payment.Authorized', new Map([['confirm', 'Confirmation']])],
    ['Payment.Declined', new Map([['retry', 'Payment.Pending'], ['cancel', 'Cart']])],
    ['Confirmation', new Map([['complete', 'Complete']])]
  ]);
  
  const hierarchy = new Map([
    ['Cart', undefined],
    ['Payment', undefined],
    ['Payment.Pending', 'Payment'],
    ['Payment.Authorized', 'Payment'],
    ['Payment.Declined', 'Payment'],
    ['Confirmation', undefined],
    ['Complete', undefined]
  ]);

  return {
    states,
    transitions,
    hierarchy,
    initialKey: 'Cart'
  };
}

describe('buildForceGraphData', () => {
  it('converts toggle shape to correct nodes and links', () => {
    const shape = createToggleShape();
    const result = buildForceGraphData(shape);
    
    expect(result.nodes).toHaveLength(2);
    expect(result.links).toHaveLength(2);
    expect(result.nodeIds.size).toBe(2);
    
    // Check nodes
    const onNode = result.nodes.find(n => n.id === 'On');
    const offNode = result.nodes.find(n => n.id === 'Off');
    
    expect(onNode).toBeDefined();
    expect(onNode?.name).toBe('On');
    expect(onNode?.fullKey).toBe('On');
    expect(onNode?.isInitial).toBe(true);
    expect(onNode?.val).toBe(15);
    expect(onNode?.color).toBe('#60a5fa');
    
    expect(offNode).toBeDefined();
    expect(offNode?.name).toBe('Off');
    expect(offNode?.fullKey).toBe('Off');
    expect(offNode?.isInitial).toBe(false);
    expect(offNode?.val).toBe(10);
    expect(offNode?.color).toBe('#8b5cf6');
    
    // Check links
    expect(result.links).toEqual(expect.arrayContaining([
      { source: 'On', target: 'Off', event: 'toggle', value: 1 },
      { source: 'Off', target: 'On', event: 'toggle', value: 1 }
    ]));
  });

  it('converts checkout (HSM) shape with hierarchical keys', () => {
    const shape = createCheckoutShape();
    const result = buildForceGraphData(shape);
    
    expect(result.nodes).toHaveLength(7);
    expect(result.links).toHaveLength(8); // Fixed: Cart->Payment, Payment.Pending->Authorized/Declined/Cancel, Payment.Authorized->Confirm, Payment.Declined->Retry/Cancel, Confirmation->Complete
    expect(result.nodeIds.size).toBe(7);
    
    // Check that hierarchical nodes exist
    const paymentPendingNode = result.nodes.find(n => n.id === 'Payment.Pending');
    const paymentAuthorizedNode = result.nodes.find(n => n.id === 'Payment.Authorized');
    
    expect(paymentPendingNode).toBeDefined();
    expect(paymentPendingNode?.fullKey).toBe('Payment.Pending');
    expect(paymentPendingNode?.name).toBe('Pending');
    
    expect(paymentAuthorizedNode).toBeDefined();
    expect(paymentAuthorizedNode?.fullKey).toBe('Payment.Authorized');
    expect(paymentAuthorizedNode?.name).toBe('Authorized');
    
    // Check initial state
    const cartNode = result.nodes.find(n => n.id === 'Cart');
    expect(cartNode?.isInitial).toBe(true);
  });

  it('uses string IDs for links, not objects', () => {
    const shape = createToggleShape();
    const result = buildForceGraphData(shape);
    
    result.links.forEach(link => {
      expect(typeof link.source).toBe('string');
      expect(typeof link.target).toBe('string');
      expect(link.source).not.toBeInstanceOf(Object);
      expect(link.target).not.toBeInstanceOf(Object);
    });
  });

  it('validates all targets exist in nodes', () => {
    const shape = createToggleShape();
    const result = buildForceGraphData(shape);
    
    result.links.forEach(link => {
      expect(result.nodeIds.has(link.source)).toBe(true);
      expect(result.nodeIds.has(link.target)).toBe(true);
    });
  });

  it('handles hierarchical machines with full paths', () => {
    const shape = createCheckoutShape();
    const result = buildForceGraphData(shape);
    
    // Should have nodes with dots in their IDs (hierarchical)
    const hierarchicalNodes = result.nodes.filter(n => n.id.includes('.'));
    expect(hierarchicalNodes.length).toBeGreaterThan(0);
    
    // All hierarchical nodes should have proper fullKey
    hierarchicalNodes.forEach(node => {
      expect(node.fullKey).toBe(node.id);
      expect(node.name).not.toContain('.'); // name should be just the leaf
    });
  });

  it('skips invalid transitions with missing targets', () => {
    // Create shape with invalid transition
    const states = new Map([
      ['A', { key: 'A', fullKey: 'A', isFinal: false, isCompound: false }],
      ['B', { key: 'B', fullKey: 'B', isFinal: false, isCompound: false }]
    ]);
    
    const transitions = new Map([
      ['A', new Map([
        ['valid', 'B'],
        ['invalid', 'C']  // C doesn't exist
      ])]
    ]);
    
    const shape: MachineShape = {
      states,
      transitions,
      hierarchy: new Map(),
      initialKey: 'A'
    };
    
    const result = buildForceGraphData(shape);
    
    // Should only include the valid transition
    expect(result.links).toHaveLength(1);
    expect(result.links[0]).toEqual({
      source: 'A',
      target: 'B',
      event: 'valid',
      value: 1
    });
  });

  it('returns empty data for shape with no states', () => {
    const shape: MachineShape = {
      states: new Map(),
      transitions: new Map(),
      hierarchy: new Map(),
      initialKey: ''
    };
    
    const result = buildForceGraphData(shape);
    
    expect(result.nodes).toHaveLength(0);
    expect(result.links).toHaveLength(0);
    expect(result.nodeIds.size).toBe(0);
  });
});
