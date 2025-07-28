import { AbortableEventHandler } from "./ext/abortable-event-handler";
import { Func, Middleware, Funcware, Effect } from "./function-types";
import { StateMachine } from "./state-machine";
import { StateMachineEvent } from "./state-machine";


export type Adapters<E extends StateMachineEvent = StateMachineEvent> = {
  [key: string]: Func;
} & {
  transition: (
    middleware: Middleware<E>
  ) => Funcware<StateMachine<E>["transition"]>;
  update: (middleware: Middleware<E>) => Funcware<StateMachine<E>["update"]>;
  resolveExit: <F extends StateMachine<E>["resolveExit"]>(
    resolveFn: F
  ) => Funcware<F>;
  guard: (
    guardFn: StateMachine<E>["guard"]
  ) => Funcware<StateMachine<E>["guard"]>;
  handle: (
    handleFn: StateMachine<E>["handle"]
  ) => Funcware<StateMachine<E>["handle"]>;
  before: (abortware: AbortableEventHandler<E>) => Funcware<Transform<E>>;
  leave: Transform<Effect<E>, Funcware<Effect<E>>>;
  after: Transform<Effect<E>, Funcware<Effect<E>>>;
  enter: Transform<Effect<E>, Funcware<Effect<E>>>;
  effect: Transform<Effect<E>, Funcware<Effect<E>>>;
  notify: Transform<Effect<E>, Funcware<Effect<E>>>;
};
type Transform<I, O = I> = (source: I) => O;
