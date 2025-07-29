import type { Disposer } from "matchina";

export type DisposableEffect<T> = (state: T) => Disposer | void;
