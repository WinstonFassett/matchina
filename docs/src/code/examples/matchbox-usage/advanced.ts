// Advanced Matchbox Usage with Custom Tag Property
import { matchboxFactory } from "matchina";

// 1. Custom tag property
export const Response = matchboxFactory(
  {
    Success: <T>(data: T) => ({ data }),
    Error: (code: number, message: string) => ({ code, message }),
    Pending: () => ({ timestamp: Date.now() }),
  },
  "status"
); // Using 'status' as tag property instead of default 'tag'

// Create instances
const success = Response.Success({ id: 123, name: "Product" });
const error = Response.Error(404, "Not found");
const pending = Response.Pending();

// The tag property is 'status' instead of 'tag'
console.log(success.status); // 'Success'
console.log(error.status); // 'Error'
console.log(pending.status); // 'Pending'

// 2. Advanced pattern matching with type safety
function processResponse<T>(
  response:
    | ReturnType<typeof Response.Success<T>>
    | ReturnType<typeof Response.Error>
    | ReturnType<typeof Response.Pending>
) {
  return response.match({
    // TypeScript knows the exact shape of data in each case
    Success: (data) => {
      // data is typed as T
      return { processed: true, result: data };
    },
    Error: ({ code, message }) => {
      // TypeScript knows error has code and message
      return { processed: false, errorCode: code, errorMessage: message };
    },
    Pending: () => {
      // TypeScript knows pending has timestamp
      return { processed: false, waiting: true };
    },
  });
}

// 3. Type narrowing with exhaustive checking
function handleResponse<T>(
  response:
    | ReturnType<typeof Response.Success<T>>
    | ReturnType<typeof Response.Error>
    | ReturnType<typeof Response.Pending>
) {
  if (response.is("Success")) {
    // TypeScript knows response is Success type
    return response.data;
  } else if (response.is("Error")) {
    // TypeScript knows response is Error type
    throw new Error(`API Error ${response.code}: ${response.message}`);
  } else {
    // TypeScript knows this must be Pending
    console.log(`Waiting since ${new Date(response.timestamp).toISOString()}`);
    return null;
  }
}
