import type { DisposeFunc } from "matchina";

export type DisposableEffect<T> = (state: T) => DisposeFunc | void;
