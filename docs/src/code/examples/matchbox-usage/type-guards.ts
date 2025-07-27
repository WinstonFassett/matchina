import { matchboxFactory } from "matchina";

const Response = matchboxFactory({
  Success: (data: any) => ({ data }),
  Error: (error: Error) => ({ error }),
});

const response = Response.Success({ id: 123 });

if (response.is("Success")) {
  // TypeScript knows this is a Success variant
  console.log(response.data.data.id); // 123
}

if (response.is("Error")) {
  // TypeScript knows this is an Error variant
  console.log(response.data.error.message);
}

// Type guard in a function parameter
function handleSuccess(
  response: ReturnType<(typeof Response)[keyof typeof Response]>
) {
  if (response.is("Success")) {
    return response.data.data;
  }
  throw new Error("Not a success response");
}
