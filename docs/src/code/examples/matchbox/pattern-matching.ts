import { matchboxFactory } from "matchina";

// Create a matchbox for light states
const Light = matchboxFactory({
  Off: undefined,
  On: (brightness = 100) => ({ brightness }),
});

// Create instances
const off = Light.Off();
const dimmed = Light.On(50);

// Pattern matching with exhaustiveness checking
function getDescription(light) {
  return light.match({
    Off: () => "The light is turned off",
    On: ({ brightness }) => `The light is on at ${brightness}% brightness`,
  });
}

console.log(getDescription(off)); // "The light is turned off"
console.log(getDescription(dimmed)); // "The light is on at 50% brightness"
