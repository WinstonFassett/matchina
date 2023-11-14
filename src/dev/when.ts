import {
  KeyedChangeEventFilter,
  isKeyedChangeEvent,
} from "../extras/typeguards";
import { SwapFunc } from "../types";
import { conditionware } from "../extras/middleware/conditionware";
import { Middleware } from "../extras/middleware/middleware";

export const when =
  <E>(filter: KeyedChangeEventFilter<E>) =>
  (...middleware: Middleware<E>[]) =>
    conditionware((ev) => isKeyedChangeEvent(ev, filter), ...middleware);

export type StateChangeMachine<E> = {
  getChange: () => E;
  update: SwapFunc<E>;
};
