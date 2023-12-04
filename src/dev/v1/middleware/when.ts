import {
  KeyedChangeEventFilter,
  isKeyedChangeEvent,
} from "../../../typeguards";
import { Middleware } from "../../../types";
import { conditionware } from "./conditionware";

export const when =
  <E>(filter: KeyedChangeEventFilter<E>) =>
  (...middleware: Middleware<E>[]) =>
    conditionware((ev) => isKeyedChangeEvent(filter, ev), ...middleware);
