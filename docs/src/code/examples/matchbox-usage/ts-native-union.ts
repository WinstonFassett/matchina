// A simple tagged union using TypeScript's native union types
type Result =
  | { status: "success"; data: string }
  | { status: "error"; message: string };

// Using the tagged union
function handleResult(result: Result) {
  switch (result.status) {
    case "success":
      // TypeScript knows result.data exists here
      return result.data.toUpperCase();
    case "error":
      // TypeScript knows result.message exists here
      return `Error: ${result.message}`;
  }
}
