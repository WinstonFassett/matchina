import type { FactoryMachine } from "../../factory-machine-types";
import type { FactoryMachineApi } from "../../factory-machine-api-types";
import { createLazyShapeStore } from "../../shape";
import { AllEventsOf } from "../utility-types";

// Enhanced machine interfaces for better type safety

export interface HierarchicalMachine<
  M extends FactoryMachine<any> = FactoryMachine<any>
> extends Omit<FactoryMachine<any>, 'send'> {
  shape: ReturnType<typeof createLazyShapeStore>;
  
  /**
   * Send an event to the hierarchical machine with support for child events
   */
  send<T extends HierarchicalEvents<M>>(
    type: T extends { type: infer EventType; params: infer EventParams }
      ? EventType
      : T extends string
        ? T
        : never,
    ...params: T extends { type: infer EventType; params: infer EventParams }
      ? EventParams
      : T extends string
        ? []
        : never
  ): void;
}

// Type representing all events in a hierarchical machine (including child.* events)

export type HierarchicalEvents<M extends FactoryMachine<any>> = 
  | AllEventsOf<M>
  | { type: "child.change"; target: any; eventType: string; params: any[]; _internal?: boolean }
  | { type: "child.exit"; target: any; eventType: string; params: any[]; _internal?: boolean }
  | { type: `child.${string}`; params: any[] };

export interface DuckTypedMachine {
  getState(): any;
  send(type: string, ...params: any[]): any;
}
export interface OptionalDuckTypedMachine {
  getState(): any;
  send?(type: string, ...params: any[]): any;
}
export interface PropagatedMachine extends DuckTypedMachine {
  __propagateUnhook?: () => void;
  hierarchical?: boolean;
  transitions?: Record<string, Record<string, any>>;
  resolveExit?: (event: any) => any;
  transition?: (event: any) => void;
}
interface ChildChangePayload {
  target?: FactoryMachine<any>;
  type: string;
  params?: any[];
  _internal?: boolean;
}
interface InternalChildChangePayload extends ChildChangePayload {
  _internal: true;
}
// Enhanced root machine interface
export interface RootMachine {
  send: (type: string, ...params: any[]) => void;
  transition?: (event: any) => void;
  notify?: (event: any) => void;
  resolveExit?: (event: any) => any;
  getState(): any;
}

/**
 * Creates an HSM-aware event API that works with HierarchicalMachine
 * Uses the original machine's transitions while respecting the hierarchical structure
 */
export function hsmEventApi<M extends FactoryMachine<any>>(
  machine: M,
  hsm: HierarchicalMachine<M>
): FactoryMachineApi<M> {
  const { states, transitions } = machine;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
      return hsm.send(eventKey, ...params);
    };

  const transitioners: any = {};
  const events: any = {};
  for (const stateKey in states) {
    const transitionKey = stateKey as keyof typeof transitions;
    const stateTransitions = transitions[transitionKey];
    transitioners[transitionKey] = {};
    if (stateTransitions) {
      for (const eventKey in stateTransitions) {
        const sender = createSender(eventKey);
        transitioners[transitionKey][eventKey] = sender;
        events[eventKey] ||= sender;
      }
    }
  }
  return events;
}
