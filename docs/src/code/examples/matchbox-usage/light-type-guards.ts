import { matchboxFactory } from "matchina";
// ---cut---
// Create a Light matchbox with On/Off states
const Light = matchboxFactory({
  Off: undefined,
  On: (percentage = 100) => ({ percentage }),
});

// Create light instances
const light1 = Light.Off();
const light2 = Light.On(75);

// Type guards with automatic type narrowing
if (light2.is("On")) {
  // TypeScript knows light2.data has percentage
  console.log(`Brightness: ${light2.data.percentage}%`);

  // This would be a TypeScript error:
  // console.log(light2.data.invalid); // Error: Property 'invalid' does not exist
}

// Type guards can be used in conditions
function getBrightness(
  light: ReturnType<typeof Light.Off> | ReturnType<typeof Light.On>
) {
  if (light.is("Off")) {
    return 0;
  }
  // TypeScript knows this must be the "On" state with percentage
  return light.data.percentage;
}

console.log(getBrightness(light1)); // 0
console.log(getBrightness(light2)); // 75
