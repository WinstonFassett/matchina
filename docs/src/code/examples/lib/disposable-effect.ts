import type { Disposer } from "@lib/src";

export type DisposableEffect<T> = (state: T) => Disposer | void;