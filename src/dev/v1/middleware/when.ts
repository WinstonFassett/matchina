import {
  KeyedChangeEvent,
  ChangeEventKeys,
  KeyedChangeEventFilter,
  isKeyedChangeEvent,
} from "../../../typeguards";
import { Middleware } from "../../../types";
import { Filters } from "../typeguards";
import { conditionware } from "./conditionware";

export const when =
  <E extends KeyedChangeEvent>(filter: Filters<ChangeEventKeys<E>>) =>
  (...middleware: Middleware<E>[]) =>
    conditionware((ev) => isKeyedChangeEvent(ev, filter as any), ...middleware);
