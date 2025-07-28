import { enhanceMethod, iff } from "./ext";
import { createDisposer } from "./ext/setup";
import { Disposer } from "./function-types";
import {
  FactoryMachine,
  FactoryMachineContext,
  FactoryMachineEvent,
} from "./factory-machine-types";
import {
  StateEventHookConfig,
  StateHookConfig,
} from "./factory-machine-lifecycle-types";
import { HookAdapters } from "./state-machine-hook-adapters";
import { matchChange } from "./match-change";
import { ChangeEventKeyFilter } from "./match-change-types";

/**
 * Registers lifecycle hooks for a FactoryMachine, allowing fine-grained control over state transitions.
 * Supports wildcards for state and event keys, direct entry handlers, and ensures handlers are strongly typed.
 * Returns a disposer to remove all registered hooks.
 *
 * ## Supported Hook Adapter Names
 *
 * **State-level hooks (top-level):**
 * - {@link enter} — runs when entering the state
 * - {@link leave} — runs when leaving the state
 * - {@link notify} — runs after state change
 * - {@link effect} — runs side effects
 * - {@link transition}, {@link resolveExit}, {@link guard}, {@link update}, {@link handle}, {@link after} — advanced hooks for full lifecycle control
 *
 * **Event-level hooks (inside `on`):**
 * - Direct entry handler: `on.event = fn` — runs as entry for event (after leave, before effect)
 * - Full hook object: `on.event = { before, effect, after }`
 * - {@link before} — runs before the event transition
 * - {@link after} — runs after the event transition
 *
 * ## Wildcard Behavior
 * - Use "*" as a state or event key to match all states/events.
 * - Example: `{ "*": { enter: fn } }` runs `enter` for every state.
 * - You can also put event handlers like `on.executing` in the wildcard to match all prior states:
 *   ```typescript
 *   onLifecycle(machine, {
 *     "*": {
 *       on: {
 *         executing: { before: (ev) => {} } // runs before executing event for any state
 *       }
 *     }
 *   });
 *   ```
 *
 * ## Typing Benefits
 * - Handlers receive fully typed event objects, matching the machine's state/event types.
 * - Return types are enforced, e.g. `guard` returns boolean, `handle` returns event or undefined.
 *
 * ## Structure & Sequence
 * - Top-level keys are state names (or "*" for all states).
 * - Inside each state, you can use hooks (`enter`, `leave`, etc.) and the `on` block for event-specific hooks.
 * - Inside `on`, event names (or "*") map to event hooks (`before`, `after`), direct entry handlers, or full hook objects.
 * - Hooks are registered in the order: enter, leave, on (event-specific).
 * - For each event, matching hooks are evaluated in the order they are registered.
 * - Wildcard hooks are applied after specific hooks for the same phase.
 *
 * ## Example
 * ```typescript
 * onLifecycle(machine, {
 *   Idle: {
 *     enter: (ev) => {}, // handler for entering Idle
 *     leave: (ev) => {}, // handler for leaving Idle
 *     on: {
 *       executing: {
 *         before: (ev) => {}, // before executing event
 *         after: (ev) => {},  // after executing event
 *       },
 *       tick: (ev) => {}, // direct entry handler for tick
 *     }
 *   },
 *   "*": {
 *     notify: (ev) => {}, // handler for all states
 *     on: {
 *       "*": { after: (ev) => {} }, // handler for all events
 *       tick: (ev) => {}, // direct entry handler for tick on all states
 *     }
 *   }
 * });
 * ```
 *
 * @param machine - The FactoryMachine instance to enhance.
 * @param config - Configuration object mapping states/events to hook functions.
 * @returns Disposer function to remove all registered hooks.
 */
export function onLifecycle<FC extends FactoryMachineContext>(
  machine: FactoryMachine<FC>,
  config: StateHookConfig<FC>
) {
  const disposers = [] as Disposer[];
  for (const key in config) {
    const stateKey = key === "*" ? undefined : key;
    const fromStateConfig = config[key as keyof typeof config];
    if (!fromStateConfig) {
      continue;
    }
    const { on, enter, leave } = fromStateConfig;
    if (enter) {
      useFilteredEventConfigs(
        machine,
        { to: stateKey } as any,
        { enter } as any,
        disposers
      );
    }
    if (leave) {
      useFilteredEventConfigs(
        machine,
        { from: stateKey } as any,
        { leave } as any,
        disposers
      );
    }
    if (on) {
      for (const onKey in on) {
        const eventKey = onKey === "*" ? undefined : onKey;
        const eventConfig = on[onKey as keyof typeof on];
        if (!eventConfig) {
          continue;
        }
        if (typeof eventConfig === "function") {
          // Direct entry handler: runs after leave, before effect
          useFilteredEventConfigs(
            machine,
            { from: stateKey, type: eventKey } as any,
            { entry: eventConfig } as any,
            disposers
          );
        } else if (eventConfig && typeof eventConfig === "object") {
          // Full hook object: register all phases
          useFilteredEventConfigs(
            machine,
            { from: stateKey, type: eventKey } as any,
            eventConfig as StateEventHookConfig<FactoryMachineEvent<FC>>,
            disposers
          );
        }
      }
    }
  }
  return createDisposer(disposers);
}

function useFilteredEventConfigs<FC extends FactoryMachineContext>(
  machine: FactoryMachine<FC>,
  filter: ChangeEventKeyFilter<FactoryMachineEvent<FC>>,
  config: StateEventHookConfig<FactoryMachineEvent<FC>> | StateHookConfig<FC>,
  d: Disposer[]
) {
  for (const phase in config) {
    const hook = config[phase as keyof typeof config];
    if (hook) {
      const hookHandler = (HookAdapters as typeof HookAdapters)[
        phase as keyof typeof HookAdapters
      ];
      d.push(
        enhanceMethod(
          machine,
          phase as keyof FactoryMachine<FC>,
          iff(
            (ev: FactoryMachineEvent<FC>) => matchChange(ev, filter as any),
            (hookHandler as any)?.(hook, machine) ?? hook
          ) as any
        )
      );
    }
  }
  return d;
}
