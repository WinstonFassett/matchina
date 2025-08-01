import { matchboxFactory } from "matchina";

// Create a Light matchbox with a custom tag property name
const Light = matchboxFactory(
  {
    Off: undefined,
    On: (percentage = 100) => ({ percentage }),
  },
  "state"
); // Using 'state' instead of default 'tag'

const light = Light.On(60);

// The tag property is now called 'state'
console.log(light.state); // "On"
console.log(light.data.percentage); // 60

// All methods still work as expected
if (light.is("On")) {
  console.log(`The light is on at ${light.data.percentage}% brightness`);
}

const message = light.match({
  On: ({ percentage }) => `On: ${percentage}%`,
  Off: () => "Off",
});

console.log(message); // "On: 60%"

// This would be a TypeScript error - 'tag' doesn't exist:
// console.log(light.tag);
