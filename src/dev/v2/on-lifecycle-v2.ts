import { StateEventHookConfig } from "./on-lifecycle-types-v2";
import { enhancePhase } from "./on-phase";
import { hookware } from "./hookware";
import {
  AnyStatesFactory,
  StateChangeMachineInternals,
  TransitionConfig,
} from "./machine-types-v2";

export function onLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machineInternals: StateChangeMachineInternals<any, any, any>,
  config: StateEventHookConfig<Transitions, States>,
) {
  for (const stateKey in config) {
    const fromStateConfig = config[stateKey];
    if (!fromStateConfig) {
      continue;
    }
    const { enter, leave } = fromStateConfig;

    if (enter) {
      enhancePhase(
        machineInternals,
        "enter",
        hookware(enter as any, { to: stateKey as any }),
      );
    }
    if (leave) {
      enhancePhase(
        machineInternals,
        "exit",
        hookware(leave as any, { from: stateKey as any }),
      );
    }
    const { on } = fromStateConfig;
    if (on) {
      for (const eventKey in on) {
        const eventConfig = on[eventKey];
        if (!eventConfig) {
          continue;
        }
        for (const phase of ["guard", "handle", "before", "after"] as const) {
          const hook = eventConfig[phase];
          if (hook) {
            // console.log(`on ${phase} ${stateKey}=>${eventKey}`);
            enhancePhase(
              machineInternals,
              {
                after: "enter", // after the event is the entry phase
                before: "exit", // before the event is the exit phase
              }[phase] ?? phase,
              hookware(hook as any, {
                ["from"]: stateKey as any,
                type: eventKey as any,
              }),
            );
          }
        }
      }
    }
  }
}
