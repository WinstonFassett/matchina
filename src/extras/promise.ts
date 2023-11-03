import { defineMachine } from "../machine";
import { FlatEventKeys } from "../machine-types";
import { defineStates } from "../states";
import { Simplify } from "../types";
import { onUpdate } from "./on-update";

export function createPromiseMachine<
  T,
  A extends any[],
  E extends Error = Error,
>(makePromise?: (...args: A) => Promise<T>) {
  const states = defineStates({
    Idle: undefined,
    Pending: (...params: A) => params,
    Rejected: (error: E) => error,
    Resolved: (data: T) => data,
  }); // returns
  const Idle = states.Idle();
  Idle.key = "Idle";
  /*
  const states: MatchboxFactory<{
    Idle: undefined;
    Pending: (...params: A) => A;
    Rejected: (error: E) => E;
    Resolved: (data: T) => T;
}, "key">

  */
  type Simplified = Simplify<typeof states>; // on hover, shows:
  /*

type Simplified = {
    Idle: () => Matchbox<{
        Idle: undefined;
        Pending: (...params: A) => A;
        Rejected: (error: E) => E;
        Resolved: (data: T) => T;
    }, "key", "Idle", object>;
    Pending: (...args: A) => Matchbox<{
        ...;
    }, "key", "Pending", A>;
    Rejected: (error: E) => Matchbox<...>;
    Resolved: (data: T) => Matchbox<...>;
}
 */

  type AState = { key: string };
  type StatesFactory<T extends AState = AState, A extends any[] = any[]> = {
    [key: string]: (...args: A) => T;
  };
  type Simple = Simplify<typeof states>;
  const sf = states; // ERROR:
  /*
Conversion of type 'MatchboxFactory<{ Idle: undefined; Pending: (...params: A) => A; Rejected: (error: E) => E; Resolved: (data: T) => T; }, "key">' to type 'StatesFactory' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'Pending' is incompatible with index signature.
    Type '(...args: A) => Matchbox<{ Idle: undefined; Pending: (...params: A) => A; Rejected: (error: E) => E; Resolved: (data: T) => T; }, "key", "Pending", A>' is not comparable to type '(...args: any[]) => AState'.
      Types of parameters 'args' and 'args' are incompatible.
        Type 'any[]' is not comparable to type 'A'.
          'any[]' is assignable to the constraint of type 'A', but 'A' could be instantiated with a different subtype of constraint 'any[]'.ts(2352)
  */
  // define machine expects a StatesFactory
  const Machine = defineMachine(
    states, // ERROR:
    /*
Argument of type 'MatchboxFactory<{ Idle: undefined; Pending: (...params: A) => A; Rejected: (error: E) => E; Resolved: (data: T) => T; }, "key">' is not assignable to parameter of type 'StatesFactory'.
  Property 'Pending' is incompatible with index signature.
    Type '(...args: A) => Matchbox<{ Idle: undefined; Pending: (...params: A) => A; Rejected: (error: E) => E; Resolved: (data: T) => T; }, "key", "Pending", A>' is not assignable to type '(...args: unknown[]) => AState'.
      Types of parameters 'args' and 'args' are incompatible.
        Type 'unknown[]' is not assignable to type 'A'.
          'unknown[]' is assignable to the constraint of type 'A', but 'A' could be instantiated with a different subtype of constraint 'any[]'.ts(2345)
    */
    {
      Idle: { execute: "Pending" },
      Pending: {
        resolve: "Resolved",
        reject: "Rejected",
      },
      Resolved: {},
      Rejected: {},
    },
  );
  const initialState = states.Idle();
  const machine = Machine.create(initialState);
  if (makePromise) {
    const _makePromise = makePromise;
    function execute(params: A) {
      const promise = _makePromise(...params);
      promiseMachine.promise = promise;
      promiseMachine.done = promise
        .then(machine.event.resolve)
        .catch(machine.event.reject);
    }
    onUpdate(machine, (commit, updater) => {
      commit((before) => {
        const after = updater(before);
        if (after.type === "execute") {
          execute(after.params as A);
        }
        return after;
      });
    });
  }
  const promiseMachine = Object.assign(machine, {
    promise: undefined as undefined | Promise<T>,
    done: undefined as undefined | Promise<void>,
  });
  return promiseMachine;
}
export type PromiseMachine = ReturnType<typeof createPromiseMachine>;
export type PromiseStates = PromiseMachine["def"]["states"];
export type PromiseTransitions = PromiseMachine["def"]["transitions"];
export type PromiseStateKey = keyof PromiseStates;
export type PromiseEventKey = FlatEventKeys<PromiseStates, PromiseTransitions>;
