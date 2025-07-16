// A simple tagged union using TypeScript's native union types
type Result = 
  | { status: 'success'; data: string }
  | { status: 'error'; message: string };
  
// Using the tagged union
function handleResult(result: Result) {
  switch (result.status) {
    case 'success':
      // TypeScript knows result.data exists here
      console.log(result.data.toUpperCase());
      break;
    case 'error':
      // TypeScript knows result.message exists here
      console.log(`Error: ${result.message}`);
      break;
  }
}
