import { enhanceMethod, iff } from "./ext";
import { createDisposer } from "./ext/setup";
import { DisposeFunc } from "./function-types";
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
 *
 * ## Configuration Structure
 *
 * The configuration object is strictly keyed by entry state names (or "*" for all states).
 * For each state, you can specify:
 *   - `enter`: handler for entering the state
 *   - `leave`: handler for leaving the state
 *   - `on`: event configuration object
 *
 * ### Event Configuration (`on`)
 *
 * The `on` object is keyed by event names (or "*" for all events). For each event, you can provide:
 *   - A direct entry handler (function) for the event (runs as effect)
 *   - Or an object with any event hook handler from the machine lifecycle:
 *     - `before`, `after`, `effect`, `guard`, `handle`, `transition`, `resolveExit`, `update`, `notify`, `end`, etc.
 *
 * **Note:** Only `enter` and `leave` are valid at the state level. All other hooks must be specified inside `on` for events.
 *
 * ## Wildcard Usage
 * You can use "*" for states and events to match all states or all events. For example:
 *
 * ```ts
 * onLifecycle(machine, {
 *   "*": {
 *     on: {
 *       "*": {
 *         after: (ev) => {
 *           // Runs after any event, from any state
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * ## Example (Typechecked)
 *
 * ```ts
 * onLifecycle(machine, {
 *   Idle: {
 *     enter: (ev) => {}, // when entering Idle
 *     leave: (ev) => {}, // when leaving Idle
 *     on: {
 *       start: {
 *         before: (ev) => {}, // before start event
 *         effect: (ev) => {}, // effect for start event
 *         after: (ev) => {},  // after start event
 *         // ...any other event hook from TransitionHookExtensions
 *       },
 *       tick: (ev) => {}, // direct effect handler for tick event
 *     }
 *   },
 *   "*": {
 *     enter: (ev) => {}, // runs for all states
 *     leave: (ev) => {},
 *     on: {
 *       "*": { after: (ev) => {} }, // after any event
 *       stop: (ev) => {}, // direct effect handler for stop event
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
  const disposers = [] as DisposeFunc[];
  for (const key in config) {
    const stateKey = key === "*" ? undefined : key;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fromStateConfig = config[key]!;
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
  d: DisposeFunc[]
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
