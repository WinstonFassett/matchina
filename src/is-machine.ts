export const MATCHINA_MACHINE = Symbol("matchina.machine");

export function brandMachine(target: object) {
  try {
    Object.defineProperty(target, MATCHINA_MACHINE, {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false,
    });
  } catch {
    // ignore if cannot define (shouldn't happen in normal usage)
  }
}

export function isMachine(x: any): boolean {
  return !!x && x[MATCHINA_MACHINE] === true;
}
