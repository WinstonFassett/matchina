import {
  KeyedChangeEventFilter,
  isKeyedChangeEvent,
} from "../extras/typeguards";
import { SwapFunc } from "../types";
import { conditionware } from "./conditionware";
import { Middleware } from "./Middleware";

export const when =
  <E>(filter: KeyedChangeEventFilter<E>) =>
  (...middleware: Middleware<E>[]) =>
    conditionware((ev) => isKeyedChangeEvent(ev, filter), ...middleware);

export type StateChangeMachine<E> = {
  getChange: () => E;
  update: SwapFunc<E>;
};
