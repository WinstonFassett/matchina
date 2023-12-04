import { Middleware } from "../../../types";
import { StateChangeMachine } from "../machine-types";

type Disposer = () => void;

export function enhanceMachine<E>(
  machine: StateChangeMachine<E>,
): (enhancer: Middleware<E>) => Disposer {
  const context = machine as any;
  if (context.use) {
    return context.use.bind(context);
  }
  context.use = (enhancer: Middleware<E>) => {
    const origUpdate = machine.update;
    const bound = origUpdate.bind(machine);
    console.log("USE");
    machine.update = (updater) => {
      bound((current: any) => {
        let enhancedResult: any;
        enhancer(updater(current), (result) => {
          enhancedResult = result;
        });
        return enhancedResult ?? current;
      });
    };
    return () => {
      machine.update = origUpdate;
    };
  };
  return context.use;
}
