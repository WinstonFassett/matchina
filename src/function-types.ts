/**
 * Disposer is a function that undoes or cleans up an effect, enhancement, or subscription.
 * Commonly returned by {@link Setup} functions (see {@link createSetup}, {@link setup}, {@link buildSetup}) to restore original state.
 *
 * Disposer is a complement to a setup of some kind—whenever you initialize or enhance something, you should return a disposer to clean up.
 *
 * Effects can also return disposers to clean up after themselves. See {@link Effect}.
 */
export type Disposer = () => void;

/**
 * Setup is a function that initializes or enhances a target, returning a {@link Disposer} to clean up.
 * See {@link createSetup}, {@link setup}, {@link buildSetup} in setup.ts for setup patterns.
 */
export type Setup<T> = (target: T) => Disposer;

/**
 * Effect is a function that reacts to an event or value, typically for side effects.
 */
export type Effect<E> = (ev: E) => void;

/**
 * Middleware is a function that intercepts an event and can pass it to the next handler.
 * Useful for chaining logic or modifying event flow.
 */
export type Middleware<E> = (event: E, next: (event: E) => void) => void;

/**
 * Func is a generic function type: (...args) => result.
 */
export type Func<A = any, R = any> = (...args: A[]) => R;

/**
 * Funcware is a higher-order function type for enhancing or wrapping methods.
 *
 * Given a function type F, Funcware<F> is:
 * 
 * ```typescript
 * (...args) => (fn) => F
 * ```
 *
 * This lets you intercept, modify, or extend the behavior of a method by wrapping its logic.
 *
 * Used with {@link MethodEnhancer} and {@link createMethodEnhancer} to create method middleware.
 *
 * Example:
 * ```typescript
 * const logWare: Funcware<Foo['foo']> = (x, y, z) => fn => {
 *   console.log('before', x, y, z);
 *   const r = fn(x, y, z);
 *   console.log('after', r);
 *   return r;
 * };
 * ```
 */
export type Funcware<F extends (...params: any[]) => any> = (inner: F) => F;
