import { Disposer, Setup } from "../function-types";

/**
 * Returns a disposer function that runs an array of cleanup functions in reverse order.
 * Useful for teardown logic where order matters.
 *
 * Use cases:
 * - Aggregating multiple cleanup/disposer functions
 * - Ensuring teardown order for resources (event listeners, subscriptions, etc.)
 *
 * @param fns - Array of disposer functions
 * @returns A function that disposes all provided functions in reverse order
 * @source This function is useful for creating a cleanup routine that ensures all resources are released in the correct order.
 * It is commonly used in setup/teardown patterns where multiple resources need to be cleaned up
 * after use, such as event listeners, subscriptions, or other side effects.
 *
 * @example
 * ```ts
 * const disposer1 = () => console.log('Cleanup 1');
 * const disposer2 = () => console.log('Cleanup 2');
 * const disposeAll = createDisposer([disposer1, disposer2]);
 * disposeAll(); // Logs 'Cleanup 2' then 'Cleanup 1'
 * ```
 */
export const createDisposer = (fns: Disposer[]) => () => {
  for (let i = fns.length - 1; i >= 0; i--) {
    fns[i]();
  }
};

/**
 * @function
 * Composes multiple setup functions into a single setup function.
 *
 * Usage:
 * ```ts
 * const extensionSetup = createSetup(...extensions);
 * extensionSetup(machine1); // applies all extensions to machine1
 * ```
 *
 * Use cases:
 * - Creating a reusable setup routine for multiple targets
 * - Applying a set of extensions/setups to different machines/components
 *
 * @param setups - Setup functions to compose
 * @returns A setup function that applies all setups to a target and returns a disposer
 * @source
 * This function is useful for creating a composite setup that can be applied to a target,
 * allowing for modular and reusable setup logic. It allows multiple setups to be combined into one,
 * making it easier to manage complex initialization logic in applications.
 * It is particularly useful in scenarios where multiple setups need to be applied to a single target,
 * such as in state machines, event handlers, or other components that require setup and teardown logic
 *
 * @example
 * ```ts
 * const setupA = (target: any) => () => console.log('A cleanup');
 * const setupB = (target: any) => () => console.log('B cleanup');
 * const extensionSetup = createSetup(setupA, setupB);
 * const dispose = extensionSetup({});
 * dispose(); // Logs 'B cleanup' then 'A cleanup'
 * ```
 */
export const createSetup: <T>(...setups: Setup<T>[]) => Setup<T> =
  (...setups) =>
  (target) =>
    createDisposer(setups.map((fn) => fn(target)));

/**
 * Returns a function that applies multiple setups to a specific target and returns a disposer for all.
 *
 * Usage:
 *   const machine1Setup = setup(machine1);
 *   machine1Setup(...extensions); // applies extensions to machine1
 *   machine1Setup(anotherExtension); // can be called again for more setups
 *
 * Use cases:
 * - Managing setup/teardown for a single target with multiple extensions
 * - Incrementally applying setups to a target
 *
 * @param target - The setup target
 * @returns Function accepting setups, returning a disposer
 * @source This function is useful for creating a setup routine that can be applied to a target,
 * allowing for modular and reusable setup logic. It allows multiple setups to be combined into one,
 * making it easier to manage complex initialization logic in applications.
 * It is particularly useful in scenarios where multiple setups need to be applied to a single target,
 * such as in state machines, event handlers, or other components that require setup and teardown logic
 *
 * @example
 * ```ts
 * const machine = {};
 * const setupA = (target: any) => () => console.log('A cleanup');
 * const setupB = (target: any) => () => console.log('B cleanup');
 * const machineSetup = setup(machine);
 * const dispose = machineSetup(setupA, setupB);
 * dispose(); // Logs 'B cleanup' then 'A cleanup'
 * ```
 */
export const setup =
  <T>(target: T): ((...setups: Setup<T>[]) => Disposer) =>
  (...setups: Setup<T>[]) =>
    createDisposer(setups.map((fn) => fn(target)));

/**
 * Builder for setup/disposer logic. Allows incremental addition of setups and returns a tuple:
 * [add, dispose].
 * - add: function to add setups and get a disposer for them
 * - dispose: function to dispose all setups added so far
 *
 * Use cases:
 * - Dynamically building up setup logic for a target
 * - Managing complex initialization and teardown flows
 *
 * @param target - The setup target
 * @returns [add, dispose] tuple
 * @source This function is useful for scenarios where setup logic needs to be built up incrementally,
 * such as when extensions or handlers are added dynamically. It provides a way to manage and dispose
 * all setups applied to a target, making it easier to handle complex initialization and teardown flows
 * in applications like state machines, event-driven systems, or modular components.
 *
 * @example
 * ```ts
 * const machine = {};
 * const setupA = (target: any) => () => console.log('A cleanup');
 * const setupB = (target: any) => () => console.log('B cleanup');
 * const [add, dispose] = buildSetup(machine);
 * add(setupA);
 * add(setupB);
 * dispose(); // Logs 'B cleanup' then 'A cleanup'
 * ```
 */
export const buildSetup = <T>(target: T) => {
  const d: Disposer[] = [];
  const add = (...setups: Setup<T>[]) => {
    d.push(...setups.map((fn) => fn(target)));
    return () => {
      for (let i = d.length - 1; i >= 0; i--) {
        d[i]();
      }
    };
  };
  return [add, () => createDisposer(d)()];
};
