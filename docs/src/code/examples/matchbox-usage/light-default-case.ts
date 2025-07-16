import { matchboxFactory } from 'matchina';

// Create a Light matchbox with On/Off states
const Light = matchboxFactory({
  Off: undefined,
  On: (percentage = 100) => ({ percentage })
});

const light = Light.On(25);

// Using the default case (_) for simplified matching
const isOn = light.match({
  On: () => true,
  _: () => false // Handles any other case (Off in this example)
});

console.log(isOn); // true

// Default case can extract arguments too
const brightnessMessage = light.match({
  On: ({ percentage }) => {
    if (percentage < 30) return "Dim";
    if (percentage < 70) return "Medium";
    return "Bright";
  },
  _: () => "Off"
});

console.log(brightnessMessage); // "Dim"

// Default case with non-exhaustive matching (false parameter)
// Note: This is less type-safe but sometimes convenient
const simpleCheck = light.match({
  On: ({ percentage }) => percentage > 50 ? "Bright enough" : "Too dim",
}, false);

console.log(simpleCheck); // "Too dim"
