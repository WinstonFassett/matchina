// Compat shim: re-export new branding helpers to consolidate branding modules.
// Old symbol and helpers removed; prefer src/machine-brand and src/store-brand.

export { MATCHINA_FACTORY, brandFactoryMachine as brandMachine, isFactoryMachine as isMachine } from "./machine-brand";
export { MATCHINA_STORE, brandStoreMachine, isStoreMachine } from "./store-brand";
