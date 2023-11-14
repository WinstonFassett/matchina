import { KeyedChangeEventFilter, isKeyedChangeEvent } from "../typeguards";
import { Middleware } from "./middleware";
import { conditionware } from "./conditionware";

export const when =
  <E>(filter: KeyedChangeEventFilter<E>) =>
  (...middleware: Middleware<E>[]) =>
    conditionware((ev) => isKeyedChangeEvent(ev, filter), ...middleware);
