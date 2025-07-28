
export type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};

export type MethodOf<T, K extends keyof T> = T[K] extends (
  ...args: any[]
) => any ? T[K] : never;

