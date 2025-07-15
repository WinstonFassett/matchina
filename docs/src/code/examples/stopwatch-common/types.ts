import type { FactoryMachine } from "matchina";

export const StateData = {
  Stopped: () => ({ elapsed: 0 }),
  Ticking: (elapsed = 0, at = Date.now()) => ({ at, elapsed }),
  Suspended: (elapsed = 0) => ({ elapsed }),
};

export interface Stopwatch {
  state: { key: keyof typeof StateData; data: any; match: any; };
  elapsed: number;
  machine: FactoryMachine<{ states: any; transitions: any; }>;
  start(): void;
  stop(): void;
  suspend(): void;
  resume(): void;
  clear(): void;
}
