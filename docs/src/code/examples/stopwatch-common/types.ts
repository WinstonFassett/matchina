import type { FactoryMachine, States } from "matchina";

export const StateData = {
  Stopped: () => ({ elapsed: 0 }),
  Ticking: (elapsed = 0, at = Date.now()) => ({ at, elapsed }),
  Suspended: (elapsed = 0) => ({ elapsed }),
};

export interface Stopwatch
  extends FactoryMachine<{
    states: States<typeof StateData>;
    transitions: {
      Stopped: { start: "Ticking" };
      Ticking: { stop: "Stopped"; suspend: "Suspended"; clear: "Ticking" };
      Suspended: { stop: "Stopped"; resume: "Ticking"; clear: "Suspended" };
    };
  }> {
  elapsed: number;
  start(): void;
  stop(): void;
  suspend(): void;
  resume(): void;
  clear(): void;
}
