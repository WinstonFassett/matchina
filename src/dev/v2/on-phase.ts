import { Middleware, runMiddleware } from "../../extras/middleware";
import { Phase, PhaseInternals, Phases } from "./machine-types-v2";
import { withHooks } from "./withHooks";
import { StateChangeMachineInternals } from "./machine-types-v2";

export function enhancePhase<E>(
  machineInternals: StateChangeMachineInternals<any, any, any>,
  phase: Phase,
  ...middlewares: Middleware<E>[]
): () => void {
  // console.log("onPhase", phase);
  const internals = machineInternals as typeof machineInternals &
    PhaseInternals<E>;

  // const u = withHooks(internals, {
  //   [phase]: middlewares
  // })
  // requires hooks to be mounted and extendable
  // just call withHooks and let it handle this
  internals.phases ??= {} as any;
  if (!internals.phases.__cleanup) {
    const hookAdapters = {};
    for (const phase of Phases) {
      hookAdapters[phase] = (event, next) => {
        // console.log("hook adapter", phase);
        const phaseHooks = internals.phases[phase] ?? [];
        // console.group()
        if (["enter", "exit"].includes(phase)) {
          // console.log(phase, phaseHooks.length, "hooks");
          for (const hook of phaseHooks) {
            // console.log('run', hook)
            hook(event, (x) => {
              // console.log('done', { x })
            });
          }
        } else {
          runMiddleware(phaseHooks, event, next);
        }
        // console.group()
        // console.log(`/${phase}`);
      };
    }

    const u = withHooks(internals, hookAdapters);
    // console.log("setup hook middleware");
    internals.phases.__cleanup = () => {
      u();
      // console.log("cleaned up hook middleware");
    };
  }
  const phaseHooks = (internals.phases[phase] ??= []);
  phaseHooks.splice(phaseHooks.length, 0, ...middlewares);
  return () => {
    phaseHooks.splice(phaseHooks.indexOf(middlewares[0]), middlewares.length);
    if (internals.phases[phase]?.length === 0) {
      delete internals.phases[phase];
    }
  };
}
