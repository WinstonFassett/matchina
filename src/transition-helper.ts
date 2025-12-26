/**
 * Transition helper for making parameterized transitions inspectable.
 *
 * @example
 * ```ts
 * const typed = t(
 *   (value: string) => (ev) => {
 *     // Complex logic here
 *     return value ? activeStates.Suggesting(...) : activeStates.Empty(...);
 *   },
 *   // Discovery: call handler with sample inputs
 *   (f) => [f(""), f("search term")]
 * );
 * ```
 */
export function t<S extends { key: string }>(
  handler: (...args: any[]) => (ev: any) => S,
  discover?:
    | ((f: typeof handler) => S[])  // Receives handler, calls it with samples
    | (() => S[])                    // Just returns possible states
) {
  if (discover) {
    let results: S[];

    // Detect which form of discover we have
    if (discover.length === 1) {
      // Receives handler - call it
      results = (discover as (f: typeof handler) => S[])(handler);
    } else {
      // No params - just returns states
      results = (discover as () => S[])();
    }

    // Extract state keys for visualization
    const targets = results.map(r => r.key);
    (handler as any)._targets = targets;
  }

  return handler;
}

/**
 * Check if a transition has inspection metadata
 */
export function hasTargets(transition: any): transition is { _targets: string[] } {
  return transition && typeof transition === 'function' && Array.isArray(transition._targets);
}

/**
 * Get possible target states from a transition
 */
export function getTargets(transition: any): string[] | null {
  return hasTargets(transition) ? transition._targets : null;
}
