import { matchesChangeEventKeys } from "../../../match-property-filters";
import {
  KeyedChangeEvent,
  ChangeEventKeys,
  KeyedChangeEventFilter,
} from "../../../typeguards";
import { Middleware } from "../../../types";
import { Filters } from "../typeguards";
import { conditionware } from "./conditionware";

export const when =
  <E extends KeyedChangeEvent>(filter: Filters<ChangeEventKeys<E>>) =>
  (...middleware: Middleware<E>[]) =>
    conditionware((ev) => matchesChangeEventKeys(ev, filter as any), ...middleware);
