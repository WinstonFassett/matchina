// Minimal runtime branding for factory machines.
// Keep this tiny: single symbol, non-enumerable property, and a small guard.

export const MATCHINA_FACTORY = Symbol("matchina.factory");

export function brandFactoryMachine(target: object) {
  try {
    Object.defineProperty(target, MATCHINA_FACTORY, {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false,
    });
  } catch {
    // ignore if cannot define
  }
}

export function isFactoryMachine(x: any): boolean {
  return !!x && x[MATCHINA_FACTORY] === true;
}
