// Helper type to check if a type is never
type IsNever<T> = [T] extends [never] ? true : false;

// Type to extract the property value type from a union member
export type PropertyValue<T, K extends keyof any> = T extends Record<K, any> ? T[K] : never;

// Type to check if the property value of a union member matches any of the values in the array
type MatchesValue<T, K extends keyof any, V> = 
    V extends ReadonlyArray<infer U> ? 
        IsNever<Extract<PropertyValue<T, K>, U>> extends true ? 
            false : 
            true 
        : 
        PropertyValue<T, K> extends V ? 
            true : 
            false;

// Type to filter the union
type FilterUnion<T, Condition> = T extends T ? 
    { [K in keyof Condition]: MatchesValue<T, K, Condition[K]> } extends { [K in keyof Condition]: true } ? 
        T : 
        never 
    : 
    never;

// Example usage
type Union = { type: 'execute'; value: number } | { type: 'resolve'; value: string } | { type: 'cancel'; value: boolean };
type Filtered = FilterUnion<Union, { type: ['execute', 'cancel'] }>;
