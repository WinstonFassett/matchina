import { ChangeEvent } from "./transition-machine";

export interface Notifier<T> {
  notify: (value: T) => void;
}

export interface Updater<T> {
  update: (value: T) => void;
}


interface CommandEvent<T, P extends any[]> {
  type: T;
  params: P;
}

export type ChangeCommandEvent<
  Type extends string = string,
  Params extends any[] = any[],
  To extends any = any,
  From extends any = To,
> = ChangeEvent<Type, To, From> & CommandEvent<Type, Params>;

export type Commander<T, P extends any[]> = {
  send: (type: T, ...params: P) => void;
};

export interface Handler<T> {
  handle: (value: T) => T;
}

export interface Effecter<T> {
  effect: (value: T) => void;
}

export interface Guarder<T> {
  guard: (value: T) => boolean;
}

interface Extender<T, X> {
  extend(value: T): X & T;
}

export interface Transitioner<T> {
  transition: (value: T) => T;
}

export interface EventLifecycle<T> {
  before: (value: T) => T;
  exit: (value: T) => void;
  enter: (value: T) => void;
  after: (value: T) => void;
}

export type TransitionRecord<T = any> = Record<string, Record<string, T>>;

export interface State<K extends string = string, D = any> {
  key: K;
  data?: D;
}
export interface TransitionContext {
  transitions: TransitionRecord;
}

