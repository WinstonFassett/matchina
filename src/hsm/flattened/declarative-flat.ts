/**
 * Declarative API for creating flattened hierarchical state machines
 *
 * ## Overview
 *
 * Provides an elegant, DRY way to define hierarchical state machines that are
 * automatically flattened to dot-notation internally. This API solves the problem
 * of repetitive dot-notation state keys and manual synthetic parent state management.
 *
 * ## Implementation Note
 *
 * **Internal API (verbose, repetitive):**
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
 * **Public API (declarative, DRY):**
 * ```typescript
 * createHSM({
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
 * const machine = createHSM({
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
 * ## Internal Implementation
 *
 * The API converts the hierarchical config to the same internal format as the internal `createFlatMachine`:
 * - States: `{ 'Payment.MethodEntry': () => ({}), 'Payment.Authorizing': () => ({}) }`
 * - Transitions: `{ 'Payment.MethodEntry': { authorize: 'Payment.Authorizing' } }`
 * - Synthetic parents: `{ Payment: { back: 'Cart', 'child.exit': 'Review' } }`
 *
 * This means all existing flat machine functionality works:
 * - Parent transition fallback (child inherits parent transitions)
 * - Automatic child.exit triggering (when final states are reached)
 * - Static shape metadata for visualization
 */

import { defineStates, type StateMatchboxFactory } from "../../define-states";
import { createMachine } from "../../factory-machine";
import type { FactoryMachineTransitions } from "../../factory-machine-types";
import { enhanceWithShape, createStaticShapeStore } from "../../shape";
import type { KeysWithZeroRequiredArgs } from "../../utility-types";
import { DeclarativeStateConfig, DeclarativeFlatMachineConfig } from "./types";
import { withFlattenedChildExit } from "./flattened-child-exit";
import { withParentTransitionFallback } from "./parent-transition-fallback";
import { flattenStates, flattenTransitions } from "./flatten";

/**
 * Resolves parent state keys to their initial child
 * E.g., 'Payment' -> 'Payment.MethodEntry'
 * But 'Payment.Authorizing' stays as 'Payment.Authorizing' (explicit path)
 */
function resolveInitialChild(
  stateKey: string,
  config: Record<string, DeclarativeStateConfig>
): string {
  const parts = stateKey.split(".");
  let current = config;
  let resolvedKey = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLastPart = i === parts.length - 1;

    resolvedKey = resolvedKey ? `${resolvedKey}.${part}` : part;
    const stateConfig = current[part];

    if (!stateConfig) {
      break;
    }

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
 * This API provides ergonomic hierarchical definition with improved type inference.
 * For maximum type safety, use `as const` with your config.
 *
 * @example
 * ```typescript
 * const machine = createHSM({
 *   initial: 'Payment',
 *   states: {
 *     Payment: {
 *       initial: 'MethodEntry',
 *       states: {
 *         MethodEntry: {
 *           data: (amount: number) => ({ amount }),
 *           on: { authorize: 'Authorizing' }
 *         }
 *       }
 *     }
 *   }
 * } as const);
 * ```
 */
export function createHSM<T extends DeclarativeFlatMachineConfig>(config: T) {
  // Flatten states to dot-notation
  const flatStates = flattenStates(config.states);

  // Flatten transitions to dot-notation and resolve parent states to their initial children
  const flatTransitions = flattenTransitions(config.states);

  // Resolve parent state targets to their initial children
  for (const [stateKey, transitions] of Object.entries(flatTransitions)) {
    for (const [event, target] of Object.entries(transitions)) {
      if (typeof target === "string") {
        // Check if this target is a parent state that needs resolution
        try {
          const resolved = resolveInitialChild(target, config.states);
          if (resolved !== target) {
            flatTransitions[stateKey][event] = resolved;
          }
        } catch {
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

  // Ensure all states have a transitions entry (even if empty)
  // This is required for visualization and introspection
  for (const stateKey of Object.keys(flatStates)) {
    if (!(stateKey in flatTransitions)) {
      flatTransitions[stateKey] = {};
    }
  }

  // Create flat machine using internal API
  // Type assertions required: declarative config is runtime-dynamic, preventing compile-time type inference
  // Users requiring maximum type safety should use defineStates() directly with createMachine()
  // Note: internal createFlatMachine already applies parent transition fallback and child.exit handling
  return createFlatMachine(states, flatTransitions as any, initialKey) as any;
}

/**
 * Internal flat machine creation from states and transitions.
 *
 * Handles all internal complexity:
 * - Detects if flattening is needed (dot-notation states)
 * - Flattens hierarchical structures automatically
 * - Creates the machine
 * - Applies enhancements (parent fallback, child exit)
 * - Attaches static shape for visualization
 *
 * This is an internal implementation detail used by createHSM().
 */

export function createFlatMachine<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends KeysWithZeroRequiredArgs<SF> | ReturnType<SF[keyof SF]>
>(states: SF, transitions: T, initial: I) {
  // Create raw machine
  const machine = createMachine(states, transitions, initial);

  // Apply parent transition fallback for flattened machines
  // This allows child states to inherit parent transitions
  withParentTransitionFallback(machine);

  // Apply automatic child.exit triggering for flattened machines
  // When a final child state is reached, automatically send child.exit event
  withFlattenedChildExit(machine);

  // Attach static shape store for visualization and introspection
  // Flattened machines have immutable structure (locked at creation)
  return enhanceWithShape(machine, createStaticShapeStore(machine));
}

