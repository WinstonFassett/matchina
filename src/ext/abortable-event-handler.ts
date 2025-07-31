import { DisposeFunc } from "../function-types";

export type AbortableEventHandler<E> = (event: E, abort: DisposeFunc) => void;
