import { composeMiddleware } from "./composeMiddleware";
import { Middleware } from "./Middleware";
import { StateChangeMachine } from "./when";

export type Disposer = () => void;

export function enhanceMachine<E>(
  machine: StateChangeMachine<E>,
): (...middleware: Middleware<E>[]) => Disposer {
  const context = machine as any;
  if (context.use) return context.use;
  context.use = (...middleware: Middleware<E>[]) => {
    const origUpdate = machine.update;
    const bound = origUpdate.bind(machine);
    if (!middleware[0]) throw new TypeError("middleware is required");
    console.log({ middleware });
    const composed = composeMiddleware(...middleware);
    console.log("USE");
    machine.update = (updater) => {
      bound((current: any) => {
        // console.log('Updater')
        // console.group()
        const updated = updater(current);
        // console.groupEnd()
        // console.log('Apply update', {current: current.to.key, udpated: updated.to.key})
        // console.group()
        let enhancedResult: any;
        composed(updated, (result) => {
          enhancedResult = result;
          // console.log('RESULT', enhancedResult?.to.key)
        });
        // console.groupEnd()
        // console.log('End Composed', enhancedResult?.to.key)
        return enhancedResult ?? current;
      });
    };
    return () => {
      machine.update = origUpdate;
    };
  };
  return context.use;
}
