import {
  AnyKeyedChangeEvent,
  KeyedChangeEventFilter,
  isKeyedChangeEvent,
} from "../../../typeguards";
import { Middleware } from "../../../types";
import { conditionware } from "./conditionware";

export const when =
  <E extends AnyKeyedChangeEvent>(filter: KeyedChangeEventFilter<E>) =>
  (...middleware: Middleware<E>[]) =>
    conditionware((ev) => isKeyedChangeEvent(filter, ev), ...middleware);
