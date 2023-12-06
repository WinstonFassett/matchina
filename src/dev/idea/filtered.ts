import { Func } from "../../utility-types";

export function filtered<F extends Func>(
  fn: (...params: Parameters<F>) => boolean,
) {
  return (inner: F) =>
    (...params: Parameters<F>) => {
      if (fn(...params)) return inner(...params);
    };
}

// export const fx = <P extends any[]>(
//   test: (...params: P) => boolean,
//   fn: (...params: P) => any,
//   ) => (...params: P) => {
//     test(...params) && fn(...params);
//   }

//   export function when2<E>(
//     filter: (ev: E) => boolean,
//     handler: (ev: E) => any
//   ): (ev: E) => any {
//     return (ev) => {
//       if (filter(ev)) {
//         handler(ev);
//       }
//     };
//   }
// export function thing<T>(fn: (x: T) => any) {
//   // return (x: T) => fn(x);
//   return (x: T) => fn(x);
// } 

// // const filterware = <T>(fn: (value: T) => boolean) => (inner: (x: T) => any) => (x: T) => {
// //   if (fn(x)) return inner(x);
// // }

// const filterMiddleware =
//   <T>(filter: (value: T) => boolean, next) =>
//   (inner: (x: T) => any) =>
//   (x: T) => {
//     if (fn(x)) return inner(x);
//   };


// const identityFn = <T>(x: T) => x;
// type IdentityFn<T> = <T>(x: T) => T;
// export const identityFnCreator = <T>(fn: IdentityFn<T>) => fn

// export const another = <A extends any[]>(fn: (...args: A)=> boolean, fn2: (...args: A) => any) => {
//   return (...args: A) => {
//     if (fn(...args)) return fn2(...args);
//   }
// }

// export const eventThing = <E>(fn: (ev: E) => boolean, inner: (ev: E) => any) => (ev: E) => {
//   if (fn(ev)) return inner(ev);
// }