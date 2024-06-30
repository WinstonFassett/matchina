export type Funcware<F extends (...params: any[]) => any> = (inner: F) => F;
