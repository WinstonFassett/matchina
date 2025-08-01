import { z } from "zod";
import { defineStates } from "../define-states";
import { Func } from "../function-types";

/**
 * Creates state factories from Zod schemas
 *
 * @param schemas An object mapping state names to Zod schemas
 * @returns A state factory object with properly typed state creation functions
 *
 * @example
 * ```typescript
 * const IdleSchema = z.object({});
 * const LoadingSchema = z.object({ progress: z.number() });
 * const ErrorSchema = z.object({ message: z.string() });
 *
 * const states = defineZodStates({
 *   Idle: IdleSchema,
 *   Loading: LoadingSchema,
 *   Error: ErrorSchema
 * });
 *
 * // Usage:
 * states.Idle(); // No parameters needed
 * states.Loading({ progress: 0.5 }); // Type-checked parameters
 * states.Error({ message: "Error occurred" }); // Type-checked parameters
 * ```
 */
export function defineZodStates<T extends Record<string, z.ZodType>>(
  schemas: T
) {
  type SchemaMap = {
    [K in keyof T]: (
      data?: z.infer<T[K]> extends Record<string, never> ? void : z.infer<T[K]>
    ) => z.infer<T[K]>;
  };

  const stateFactories = {} as Record<string, Func>;

  for (const [key, schema] of Object.entries(schemas)) {
    stateFactories[key] = (data: any) => schema.parse(data);
  }

  return defineStates(stateFactories as SchemaMap);
}
