// @ts-nocheck
/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

type State<K extends keyof any = string> = {
  key: K;
};
type MyStates = {
  Idle(): State<"Idle">;
  Loading(): State<"Loading">;
  Success(): State<"Success">;
  Failure(): State<"Failure">;
};

type MyTransitions = {
  Idle: (x: number, ...whatever: any[]) => MyStates["Loading"];
  Loading: (s: string) => MyStates["Success"];
};

// Implementation
type TargetStates = {
  [K in keyof MyTransitions]: ReturnType<MyTransitions[K]>;
};
type TargetStatesForParams1<P extends any[]> = {
  [K in keyof MyTransitions]: MyTransitions[K] extends (...args: P) => any
    ? ReturnType<MyTransitions[K]>
    : never;
};

// Test
const x = {} as TargetStates; // should be { Idle: MyStates['Loading'], Loading: MyStates['Success'] }
let y: TargetStatesForParams<[string]>; // should be { Loading: MyStates['Success'] }

type ParamType<T> = T extends (...args: infer U) => any ? U : never;

type TargetStatesForParams<P extends any[]> = {
  [K in keyof MyTransitions]: ParamType<MyTransitions[K]> extends [
    P[0],
    ...any[],
  ]
    ? ReturnType<MyTransitions[K]>
    : never;
};

// let y: TargetStatesForParams<[string]>; // should be { Idle: never, Loading: MyStates['Success'] }
const thing: State<any> = x.Loading();
