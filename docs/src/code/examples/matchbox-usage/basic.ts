// Basic Matchbox Usage
import { matchboxFactory } from 'matchina';

// Common setup for examples - this will be imported in the docs
export const Result = matchboxFactory({
  Success: <T>(data: T) => ({ data }),
  Error: (message: string) => ({ message }),
  Loading: () => ({})
});

// Create some instances for examples
export const success = Result.Success({ id: 1, name: 'Item' });
export const error = Result.Error('Failed to load');
export const loading = Result.Loading();

// ---cut---
// Example 1: Simple creation and usage
const result = Result.Success('hello');
console.log(result.tag); // "Success"
console.log(result.data); // { data: "hello" }

// ---cut---
// Example 2: Pattern matching with exhaustive checking
function handleResult(result) {
  return result.match({
    Success: ({ data }) => `Got data: ${JSON.stringify(data)}`,
    Error: ({ message }) => `Error: ${message}`,
    Loading: () => 'Loading...'
  });
}

// ---cut---
// Example 3: Type narrowing with is()
if (success.is('Success')) {
  // TypeScript knows this is a Success type with data property
  console.log(success.data);
  // This would cause a type error:
  // console.log(success.message);
}
