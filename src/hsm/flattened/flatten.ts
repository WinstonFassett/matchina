import { DeclarativeStateConfig } from "./types";

/**
 * Flattens a hierarchical state config to dot-notation
 *
 * Example:
 * - Input: { Payment: { states: { MethodEntry: {...} } } }
 * - Output: { 'Payment.MethodEntry': {...} }
 */
export function flattenStates(
  states: Record<string, DeclarativeStateConfig>,
  prefix = ""): Record<string, { data: (...params: any[]) => any; final?: boolean; }> {
  const flattened: Record<
    string, { data: (...params: any[]) => any; final?: boolean; }
  > = {};

  for (const [key, config] of Object.entries(states)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    // Add the state itself if it has data constructor or no child states
    if (config.data || !config.states) {
      flattened[fullKey] = {
        data: config.data || (() => ({})),
        final: config.final,
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
 * - Payment: { type: 'Suggesting' } → Payment: { type: 'Payment.Suggesting' } (targets child)
 */
export function flattenTransitions(
  states: Record<string, DeclarativeStateConfig>,
  prefix = "",
  childKeys: Record<string, Set<string>> = {}): Record<string, Record<string, string | ((...params: any[]) => any)>> {
  const flattened: Record<
    string, Record<string, string | ((...params: any[]) => any)>
  > = {};

  // First pass: collect all child keys for each parent
  for (const [key, config] of Object.entries(states)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (config.states) {
      childKeys[fullKey] = new Set(Object.keys(config.states));
    }
  }

  for (const [key, config] of Object.entries(states)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const parentKey = prefix || ""; // The parent state for resolving relative refs


    // Add transitions for this state
    if (config.on) {
      flattened[fullKey] = {};

      for (const [event, target] of Object.entries(config.on)) {
        if (typeof target === "string") {
          // Resolve relative state references
          if (target.startsWith("^")) {
            // ^ means go to parent level (strip prefix)
            flattened[fullKey][event] = target.slice(1);
          } else if (target.includes(".")) {
            // Already fully qualified
            flattened[fullKey][event] = target;
          } else if (config.states && target in config.states) {
            // Target is a direct child state
            flattened[fullKey][event] = `${fullKey}.${target}`;
          } else {
            // Relative to parent - target is a sibling state
            flattened[fullKey][event] = parentKey
              ? `${parentKey}.${target}`
              : target;
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
      Object.assign(
        flattened,
        flattenTransitions(config.states, fullKey, childKeys)
      );
    }
  }

  return flattened;
}
