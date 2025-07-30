import * as v from "valibot";
import { defineStates } from "../define-states";
import { Func } from "../function-types";

/**
 * Creates state factories from Valibot schemas
 *
 * @param schemas An object mapping state names to Valibot schemas
 * @returns A state factory object with properly typed state creation functions
 *
 * @example
 * ```typescript
 * const IdleSchema = v.object({});
 * const LoadingSchema = v.object({ progress: v.number() });
 * const ErrorSchema = v.object({ message: v.string() });
 *
 * const states = defineValibotStates({
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
export function defineValibotStates<
  T extends Record<string, v.BaseSchema<any, any, any>>,
>(schemas: T) {
  type SchemaMap = {
    [K in keyof T]: (
      data?: v.InferOutput<T[K]> extends Record<string, never>
        ? void
        : v.InferOutput<T[K]>
    ) => v.InferOutput<T[K]>;
  };

  const stateFactories = {} as Record<string, Func>;

  for (const [key, schema] of Object.entries(schemas)) {
    stateFactories[key] =
      schema.type === "object" &&
      Object.keys((schema as any).entries || {}).length === 0
        ? () => v.parse(schema, {})
        : (data: any) => v.parse(schema, data);
  }

  return defineStates(stateFactories as SchemaMap);
}
