import { FactoryMachine, createFactoryMachine } from "./factory-machine"
import { transitionMachine } from "./transition-machine"


type X = FactoryMachine<any>


type Effects = Pick<
  FactoryMachine<any>,  
  | "effect"
  | "leave"
  | "enter"
  | "notify"
  | "after"
>;

type EventEnhancers = Pick<
  FactoryMachine<any>,  
  | "guard"
  | "handle"
  | "update"
  >;
  
  type EventTransforms = Pick<
  FactoryMachine<any>,  
  | "resolve"
  | "before"
  | "transition"
  | "handle"
>;