import { matchboxFactory } from "matchina";

// Create a Light matchbox with On/Off states
const Light = matchboxFactory({
  Off: undefined,
  On: (percentage = 100) => ({ percentage }),
});

// Create a dimmed light
const light = Light.On(30);

// Pattern matching with the match method
const status = light.match({
  Off: () => "The light is off",
  On: ({ percentage }) => `The light is on at ${percentage}% brightness`,
});

console.log(status); // "The light is on at 30% brightness"

// TypeScript requires all cases to be handled
const powerStatus = light.match({
  Off: () => false,
  On: () => true,
});

// Missing cases will result in TypeScript errors
/* 
const incomplete = light.match({
  Off: () => "The light is off"
  // Error: Property 'On' is missing in type '...'
});
*/
