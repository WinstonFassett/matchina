/**
 * @interface
 * Disposer is a function that undoes or cleans up an effect, enhancement, or subscription.
 * Commonly returned by {@link SetupFunc} functions (see {@link createSetup}, {@link setup}) to restore original state.
 *
 * Disposer is a complement to a setup of some kind—whenever you initialize or enhance something, you should return a disposer to clean up.
 *
 * Effects can also return disposers to clean up after themselves. See {@link EffectFunc}.
 */
export type DisposeFunc = () => void;

/**
 * @interface
 * Setup is a function that initializes or enhances a target, returning a {@link DisposeFunc} to clean up.
 * See {@link createSetup}, {@link setup} for setup patterns.
 */
export type SetupFunc<T> = (target: T) => DisposeFunc;

/**
 * @interface
 * Effect is a function that reacts to an event or value, typically for side effects.
 */
export type EffectFunc<E> = (ev: E) => void;

/**
 * @interface
 * DisposableEffect is a type alias for functions that can be used as effects in a state machine.
 * It can be either an effect with teardown or a simple effect function.
 * This allows for flexibility in how effects are defined and used within the state machine lifecycle.
 */
export type DisposableEffect<E> = EffectFunc<E> | SetupFunc<E>;

/**
 * @interface
 * Middleware is a function that intercepts an event and can pass it to the next handler.
 * Useful for chaining logic or modifying event flow.
 */
export type MiddlewareFunc<E> = (event: E, next: (event: E) => void) => void;

/**
 * @ignore
 * Func is a generic function type: (...args) => result.
 */
export type Func<A = any, R = any> = (...args: A[]) => R;

/**
 * @interface
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
 * Used with {@link createMethodEnhancer} and {@link createMethodEnhancer} to create method middleware.
 *
 * @example
 * ```typescript
 * const logWare: Funcware<Foo['foo']> = (x, y, z) => fn => {
 *   console.log('before', x, y, z);
 *   const r = fn(x, y, z);
 *   console.log('after', r);
 *   return r;
 * };
 * ```
 */
export type Funcware<F extends Func> = (inner: F) => F;
