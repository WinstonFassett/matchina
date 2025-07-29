import { Disposer } from "../function-types";

export type AbortableEventHandler<E> = (event: E, abort: Disposer) => void;
