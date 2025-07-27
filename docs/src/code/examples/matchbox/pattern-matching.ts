import { matchboxFactory } from "matchina";

// Create a matchbox for light states
const lightStates = matchboxFactory({
  Off: undefined,
  On: (brightness = 100) => ({ brightness }),
});
type LightState = ReturnType<(typeof lightStates)[keyof typeof lightStates]>;

// Create instances
const off = lightStates.Off();
const dimmed = lightStates.On(50);

// Pattern matching with exhaustiveness checking
function getDescription(light: LightState) {
  return light.match({
    Off: () => "The light is turned off",
    On: ({ brightness }) => `The light is on at ${brightness}% brightness`,
  });
}

console.log(getDescription(off)); // "The light is turned off"
console.log(getDescription(dimmed)); // "The light is on at 50% brightness"
