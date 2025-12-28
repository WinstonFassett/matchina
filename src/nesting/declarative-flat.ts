/**
 * Declarative API for creating flattened hierarchical state machines
 *
 * ## Overview
 *
 * Provides an elegant, DRY way to define hierarchical state machines that are
 * automatically flattened to dot-notation internally. This API solves the problem
 * of repetitive dot-notation state keys and manual synthetic parent state management.
 *
 * ## Comparison with createFlatMachine
 *
 * **Old API (verbose, repetitive):**
 * ```typescript
 * const states = defineStates({
 *   'Payment.MethodEntry': () => ({}),
 *   'Payment.Authorizing': () => ({}),
 *   'Payment.Authorized': () => ({})
 * });
 * const transitions = {
 *   'Payment.MethodEntry': { authorize: 'Payment.Authorizing' },
 *   'Payment.Authorizing': { success: 'Payment.Authorized' },
 *   Payment: { back: 'Shipping' }  // Manual synthetic parent
 * };
 * createFlatMachine(states, transitions, 'Payment.MethodEntry');
 * ```
 *
 * **New API (declarative, DRY):**
 * ```typescript
 * describeHSM({
 *   initial: 'Payment',
 *   states: {
 *     Payment: {
 *       initial: 'MethodEntry',
 *       states: {
 *         MethodEntry: {
 *           data: () => ({}),
 *           on: { authorize: 'Authorizing' }  // Resolves to Payment.Authorizing
 *         },
 *         Authorizing: {
 *           data: () => ({}),
 *           on: { success: 'Authorized' }  // Resolves to Payment.Authorized
 *         },
 *         Authorized: {
 *           data: () => ({})
 *         }
 *       },
 *       on: { back: '^Shipping' }  // ^ escapes to parent level
 *     },
 *     Shipping: {
 *       data: () => ({}),
 *       on: { next: 'Payment' }  // Auto-resolves to Payment.MethodEntry
 *     }
 *   }
 * })
 * ```
 *
 * ## Key Features
 *
 * 1. **Define hierarchy once** - No repetitive dot-notation state keys
 * 2. **Auto-flattening** - Internally converts to dot-notation (e.g., `Payment.MethodEntry`)
 * 3. **Relative transitions** - `'Authorizing'` resolves to `'Payment.Authorizing'`
 * 4. **Parent escape syntax** - `'^Shipping'` goes up one level
 * 5. **Auto-resolution** - `'Payment'` resolves to `'Payment.MethodEntry'` (initial child)
 * 6. **Synthetic parents** - Automatically generated from hierarchy
 * 7. **Type inference** - Transitions inline with creation for proper type checking
 *
 * ## Transition Resolution Rules
 *
 * - **Relative**: `'Authorizing'` from `Payment.MethodEntry` → `Payment.Authorizing`
 * - **Parent escape**: `'^Shipping'` → `Shipping` (strips one level)
 * - **Fully qualified**: `'Cart.Item'` → `Cart.Item` (no change)
 * - **Parent state**: `'Payment'` → `Payment.MethodEntry` (auto-resolves to initial)
 *
 * ## Example: Checkout Flow
 *
 * ```typescript
 * const machine = createDeclarativeFlatMachine({
 *   initial: 'Cart',
 *   states: {
 *     Cart: {
 *       data: () => ({}),
 *       on: { checkout: 'Payment' }  // Goes to Payment.MethodEntry
 *     },
 *     Payment: {
 *       initial: 'MethodEntry',
 *       states: {
 *         MethodEntry: {
 *           data: () => ({}),
 *           on: {
 *             authorize: 'Authorizing',  // Payment.Authorizing
 *             back: '^Cart'              // Escape to Cart
 *           }
 *         },
 *         Authorizing: {
 *           data: () => ({}),
 *           on: {
 *             success: 'Authorized',     // Payment.Authorized
 *             error: 'MethodEntry'       // Payment.MethodEntry
 *           }
 *         },
 *         Authorized: {
 *           data: () => ({}),
 *           final: true                   // Triggers parent's child.exit
 *         }
 *       },
 *       on: {
 *         back: '^Cart',                   // Applies to all children
 *         'child.exit': '^Review'          // When final state reached
 *       }
 *     },
 *     Review: {
 *       data: () => ({}),
 *       on: { submit: 'Confirmation' }
 *     },
 *     Confirmation: {
 *       data: () => ({})
 *     }
 *   }
 * });
 *
 * machine.getState().key;  // 'Cart'
 * machine.send('checkout');
 * machine.getState().key;  // 'Payment.MethodEntry' (auto-resolved)
 * machine.send('authorize');
 * machine.getState().key;  // 'Payment.Authorizing'
 * ```
 *
 * ## Internal Flattening
 *
 * The API converts the hierarchical config to the same internal format as `createFlatMachine`:
 * - States: `{ 'Payment.MethodEntry': () => ({}), 'Payment.Authorizing': () => ({}) }`
 * - Transitions: `{ 'Payment.MethodEntry': { authorize: 'Payment.Authorizing' } }`
 * - Synthetic parents: `{ Payment: { back: 'Cart', 'child.exit': 'Review' } }`
 *
 * This means all existing flat machine functionality works:
 * - Parent transition fallback (child inherits parent transitions)
 * - Automatic child.exit triggering (when final states are reached)
 * - Static shape metadata for visualization
 */

import { defineStates } from "../define-states";
import { createFlatMachine } from "./flat-machine";

/**
 * State configuration in declarative format
 */
export interface DeclarativeStateConfig<TData = any, TParams extends any[] = any[]> {
  /** State data constructor function - if omitted, state has empty data */
  data?: ((...params: TParams) => TData);

  /** Initial child state (for parent states) */
  initial?: string;

  /** Child states (for hierarchical states) */
  states?: Record<string, DeclarativeStateConfig>;

  /** Transitions from this state */
  on?: Record<string, string | ((...params: any[]) => any)>;

  /** Mark as final state */
  final?: boolean;
}

/**
 * Root machine configuration
 */
export interface DeclarativeFlatMachineConfig {
  /** Initial state key */
  initial: string;

  /** State definitions */
  states: Record<string, DeclarativeStateConfig>;
}

/**
 * Flattens a hierarchical state config to dot-notation
 *
 * Example:
 * - Input: { Payment: { states: { MethodEntry: {...} } } }
 * - Output: { 'Payment.MethodEntry': {...} }
 */
function flattenStates(
  states: Record<string, DeclarativeStateConfig>,
  prefix = ''
): Record<string, { data: (...params: any[]) => any; final?: boolean }> {
  const flattened: Record<string, { data: (...params: any[]) => any; final?: boolean }> = {};

  for (const [key, config] of Object.entries(states)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    // Add the state itself if it has data constructor or no child states
    if (config.data || !config.states) {
      flattened[fullKey] = {
        data: config.data || (() => ({})),
        final: config.final
      };
    }

    // Recursively flatten child states
    if (config.states) {
      Object.assign(flattened, flattenStates(config.states, fullKey));
    }
  }

  return flattened;
}

/**
 * Flattens hierarchical transitions to dot-notation
 *
 * Example:
 * - Payment.MethodEntry: { authorize: 'Authorizing' } → Payment.MethodEntry: { authorize: 'Payment.Authorizing' }
 * - Payment: { back: '^Shipping' } → Payment: { back: 'Shipping' }
 */
function flattenTransitions(
  states: Record<string, DeclarativeStateConfig>,
  prefix = ''
): Record<string, Record<string, string | ((...params: any[]) => any)>> {
  const flattened: Record<string, Record<string, string | ((...params: any[]) => any)>> = {};

  for (const [key, config] of Object.entries(states)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const parentKey = prefix || '';  // The parent state for resolving relative refs

    // Add transitions for this state
    if (config.on) {
      flattened[fullKey] = {};

      for (const [event, target] of Object.entries(config.on)) {
        if (typeof target === 'string') {
          // Resolve relative state references
          if (target.startsWith('^')) {
            // ^ means go to parent level (strip prefix)
            flattened[fullKey][event] = target.slice(1);
          } else if (target.includes('.')) {
            // Already fully qualified
            flattened[fullKey][event] = target;
          } else {
            // Relative to parent of current state (not current state itself)
            // For Payment.MethodEntry with 'Authorizing', resolves to Payment.Authorizing
            flattened[fullKey][event] = parentKey ? `${parentKey}.${target}` : target;
          }
        } else {
          // Transition resolver function - pass through
          flattened[fullKey][event] = target;
        }
      }
    }

    // Recursively flatten child transitions
    // The new parent key is the full key of the current state
    if (config.states) {
      Object.assign(flattened, flattenTransitions(config.states, fullKey));
    }
  }

  return flattened;
}

/**
 * Resolves parent state keys to their initial child
 * E.g., 'Payment' -> 'Payment.MethodEntry'
 * But 'Payment.Authorizing' stays as 'Payment.Authorizing' (explicit path)
 */
function resolveInitialChild(
  stateKey: string,
  config: Record<string, DeclarativeStateConfig>
): string {
  const parts = stateKey.split('.');
  let current = config;
  let resolvedKey = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLastPart = i === parts.length - 1;

    resolvedKey = resolvedKey ? `${resolvedKey}.${part}` : part;
    const stateConfig = current[part];

    if (!stateConfig) break;

    // Only auto-resolve to initial child if this is the last part of the path
    // E.g., 'Payment' -> 'Payment.MethodEntry' (auto-resolve)
    // But 'Payment.Authorizing' -> 'Payment.Authorizing' (explicit path, don't auto-resolve Payment)
    if (isLastPart && stateConfig.states && stateConfig.initial) {
      resolvedKey = `${resolvedKey}.${stateConfig.initial}`;
      current = stateConfig.states;
    } else if (stateConfig.states) {
      // Move into child states for next iteration
      current = stateConfig.states;
    }
  }

  return resolvedKey;
}

/**
 * Create a flattened machine from declarative hierarchical config
 *
 * ⚠️ **TYPE SAFETY LIMITATION**: This API trades type inference for ergonomics.
 * State keys and transitions are determined at runtime, so TypeScript cannot
 * provide exhaustive type checking or autocomplete for state/event names.
 *
 * **For type-safe code**, use `createFlatMachine()` with `defineStates()` instead:
 * ```typescript
 * const states = defineStates({
 *   'Payment.MethodEntry': () => ({}),
 *   'Payment.Authorized': () => ({})
 * });
 * const machine = createFlatMachine(states, transitions, initial);
 * // ✅ Full type inference for states and events
 * ```
 *
 * **Use this API when**:
 * - Prototyping or less type-critical code
 * - DRY hierarchy definition is more important than type safety
 * - State structure is simple and unlikely to change
 *
 * Benefits:
 * - Define hierarchy ONCE (no repetitive dot-notation)
 * - Auto-flattens to dot-notation internally
 * - Generates synthetic parent states automatically
 * - DRY and elegant
 */
export function describeHSM(config: DeclarativeFlatMachineConfig) {
  // Flatten states to dot-notation
  const flatStates = flattenStates(config.states);

  // Flatten transitions to dot-notation and resolve parent states to their initial children
  const flatTransitions = flattenTransitions(config.states);

  // Resolve parent state targets to their initial children
  for (const [stateKey, transitions] of Object.entries(flatTransitions)) {
    for (const [event, target] of Object.entries(transitions)) {
      if (typeof target === 'string') {
        // Check if this target is a parent state that needs resolution
        try {
          const resolved = resolveInitialChild(target, config.states);
          if (resolved !== target) {
            flatTransitions[stateKey][event] = resolved;
          }
        } catch (e) {
          // If resolution fails, keep the original target
        }
      }
    }
  }

  // Create state factory using defineStates
  const stateFactories: Record<string, (...params: any[]) => any> = {};
  for (const [key, { data, final }] of Object.entries(flatStates)) {
    stateFactories[key] = (...params: any[]) => {
      const stateData = data(...params);
      return final ? { ...stateData, final } : stateData;
    };
  }

  const states = defineStates(stateFactories as any);

  // Resolve initial state - handle hierarchical initial (e.g., 'Payment.MethodEntry')
  const initialKey = resolveInitialChild(config.initial, config.states);

  // Create flat machine using existing API
  // Type assertions required: declarative config is runtime-dynamic, preventing compile-time type inference
  // Users requiring type safety should use createFlatMachine() with defineStates() directly
  return createFlatMachine(states, flatTransitions as any, initialKey) as any;
}

// Backward compatibility alias
export const createDeclarativeFlatMachine = describeHSM;
