import { iff } from "./ext";
import { when } from "./extras/when";
import { notify } from "./machine-setup";
import {
  KeyedChangeEventFilter,
  isKeyedChangeEvent,
} from "./typeguards";

// export const when =
//   <E>(filter: KeyedChangeEventFilter<E>) =>
//   (...middleware: Middleware<E>[]) =>
//     conditionware((ev) => isKeyedChangeEvent(ev, filter), ...middleware);

// export const when = <E>(
//   filter: KeyedChangeEventFilter<E>,
// ) => (fn) => notify(e => {
//   iff((ev:E) => isKeyedChangeEvent(ev, filter), inner => (ev:E) => {
//     inner(ev);
//     fn(ev);
//   })
// })

export const when = <E>(
  filter: KeyedChangeEventFilter<E>,
) => {
  return when((ev:E) => isKeyedChangeEvent(ev, filter), 
}