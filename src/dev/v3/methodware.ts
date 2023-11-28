import { Middleware, runMiddleware } from "../../extras/middleware";

export type Funcware<P extends any[], R> = Middleware<[params: P, result: R]>
const noop = () => {};


type FunctionType<T, K extends keyof T> = T[K] extends (...args: any[]) => any
  ? T[K]
  : never;


export function methodware<T, K extends keyof T, F extends FunctionType<T,K>>(
  target: T,
  methodName: K,
  middleware: Funcware<Parameters<F>, ReturnType<F>> //(inner: FunctionType<T, K>) => FunctionType<T, K>
) {
  const store = target as any;
  const original = store[methodName] as FunctionType<T, K>;
  store[methodName] = funcware(original.bind(target), middleware)  
  return () => {
    target[methodName] = original;
  };
}

export function methodwares<T, K extends keyof T, F extends FunctionType<T,K>>(
  target: T,
  methodName: K,
  middlewares: Funcware<Parameters<F>, ReturnType<F>>[] //(inner: FunctionType<T, K>) => FunctionType<T, K>
) {
  const store = target as any;
  const original = store[methodName] as FunctionType<T, K>;
  store[methodName] = funcwares(original.bind(target), ...middlewares)  
  return () => {
    target[methodName] = original;
  };
}


const EMPTY = {}
const MIDDLEWARE = 'mw'
export function funcware<P extends any[], R>(
  next: (...params: P) => R,
  middleware: Funcware<P, R>
) {
  const fn = (...params: P) => {
    let result = EMPTY as R; 
    ((fn as any).middleware as typeof middleware)([params, undefined as any], ([params, value]) => {
      // early return if value
      if (value !== EMPTY) return [params, value]
      return [params, next(...params)]
    });
    return result === EMPTY ? undefined : result;
  }
  Object.assign(fn, {
    mw: middleware,
    next
  })
  return fn
}

[].unshift()

const MIDDLEWARES = 'mws'

// like funcware but supports concatenating chains of middleware
// depends on runMiddleware
export function funcwares<P extends any[], R>(
  next: (...params: P) => R,
  ...wares: Funcware<P, R>[]
) {
  const nextStore = next as any
  const orig = nextStore.orig || next
  const existing = nextStore[MIDDLEWARES] as typeof wares
  if (existing) {
    wares = wares.concat(existing)
  }
  const fn = (...params: P) => {
    let result = EMPTY as R; 
    runMiddleware((fn as any)[MIDDLEWARES] as typeof wares, [params, undefined as any], (invocation) => {      
      result = invocation[1] as R      
    })
    return result === EMPTY ? undefined : result;
  }
  Object.assign(fn, {
    MIDDLEWARES: wares,
    orig
  })
  return fn
}