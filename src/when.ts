import { iff } from "./ext";
import { condition } from "./extras/condition";
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
  return condition((ev:E) => isKeyedChangeEvent(ev, filter), 
}