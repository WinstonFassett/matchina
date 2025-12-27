import { describe, it, expect } from 'vitest';
import { createDeclarativeFlatMachine } from '../src/nesting/declarative-flat';

describe('createDeclarativeFlatMachine', () => {
  it('should create a simple flat machine from declarative config', () => {
    const machine = createDeclarativeFlatMachine({
      initial: 'Idle',
      states: {
        Idle: {
          data: () => ({}),
          on: {
            start: 'Running'
          }
        },
        Running: {
          data: () => ({}),
          on: {
            stop: 'Idle'
          }
        }
      }
    });

    expect(machine.getState().key).toBe('Idle');
    machine.send('start');
    expect(machine.getState().key).toBe('Running');
    machine.send('stop');
    expect(machine.getState().key).toBe('Idle');
  });

  it('should handle hierarchical states with auto-flattening', () => {
    const machine = createDeclarativeFlatMachine({
      initial: 'Cart',
      states: {
        Cart: {
          data: () => ({}),
          on: { proceed: 'Payment' }
        },
        Payment: {
          initial: 'MethodEntry',
          states: {
            MethodEntry: {
              data: () => ({}),
              on: { authorize: 'Authorizing' }
            },
            Authorizing: {
              data: () => ({}),
              on: { success: 'Authorized' }
            },
            Authorized: {
              data: () => ({}),
              final: true
            }
          },
          on: {
            back: '^Cart'  // ^ means go to root level
          }
        },
        Review: {
          data: () => ({}),
          on: { submit: 'Confirmation' }
        },
        Confirmation: {
          data: () => ({})
        }
      }
    });

    // Should start in Cart
    expect(machine.getState().key).toBe('Cart');

    // Proceed to Payment (should enter Payment.MethodEntry due to initial)
    machine.send('proceed');
    expect(machine.getState().key).toBe('Payment.MethodEntry');

    // Authorize should go to Payment.Authorizing
    machine.send('authorize');
    expect(machine.getState().key).toBe('Payment.Authorizing');

    // Success should go to Payment.Authorized
    machine.send('success');
    expect(machine.getState().key).toBe('Payment.Authorized');

    // Back should use parent transition to go to Cart
    machine.send('back');
    expect(machine.getState().key).toBe('Cart');
  });

  it('should support parameterized state constructors', () => {
    const machine = createDeclarativeFlatMachine({
      initial: 'Inactive',
      states: {
        Inactive: {
          data: (count?: number) => ({ count: count ?? 0 }),
          on: {
            activate: 'Active'
          }
        },
        Active: {
          initial: 'Empty',
          states: {
            Empty: {
              data: (count: number) => ({ count, value: '' }),
              on: {
                type: 'Typing'
              }
            },
            Typing: {
              data: (count: number, value: string) => ({ count, value }),
              on: {
                clear: 'Empty'
              }
            }
          },
          on: {
            deactivate: '^Inactive'
          }
        }
      }
    });

    expect(machine.getState().key).toBe('Inactive');
    expect(machine.getState().data).toEqual({ count: 0 });
  });

  it('should handle parent transitions with child.exit', async () => {
    const machine = createDeclarativeFlatMachine({
      initial: 'First',
      states: {
        First: {
          data: () => ({}),
          on: { next: 'Second' }
        },
        Second: {
          initial: 'SubA',
          states: {
            SubA: {
              data: () => ({}),
              on: { proceed: 'SubB' }
            },
            SubB: {
              data: () => ({}),
              final: true
            }
          },
          on: {
            'child.exit': '^Third'
          }
        },
        Third: {
          data: () => ({})
        }
      }
    });

    expect(machine.getState().key).toBe('First');
    machine.send('next');
    expect(machine.getState().key).toBe('Second.SubA');
    machine.send('proceed');
    expect(machine.getState().key).toBe('Second.SubB');

    // Should auto-trigger child.exit and go to Third
    // Need to wait for the async child.exit event
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(machine.getState().key).toBe('Third');
  });
});
