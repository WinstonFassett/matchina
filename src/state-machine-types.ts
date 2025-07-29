// When resolving, "to" is not known
export type ResolveEvent<C> = Omit<C, "to">;
