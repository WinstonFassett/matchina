import { Middleware } from "../../../types";
import {
  AnyKeyedChangeEvent,
  KeyedChangeEventFilter,
  matchesChangeEventKeys
} from "../typeguards";
import { conditionware } from "./conditionware";

export const when =
  <E extends AnyKeyedChangeEvent>(filter: KeyedChangeEventFilter<E>) =>
  (...middleware: Middleware<E>[]) =>
    conditionware((ev) => matchesChangeEventKeys(ev, filter as any), ...middleware);
