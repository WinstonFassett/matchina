import { matchboxFactory } from "matchina";

// Create a Light matchbox with On/Off states
const Light = matchboxFactory({
  Off: undefined,
  On: (percentage = 100) => ({ percentage }),
});

const light = Light.On(80);

// Safe casting with runtime validation
try {
  // This works because light is actually in the "On" state
  const asOn = light.as("On");
  console.log(`Brightness: ${asOn.data.percentage}%`); // Works fine: "Brightness: 80%"

  // This will throw because light is not in the "Off" state
  const asOff = light.as("Off");
  console.log("This line will never execute");
} catch (e: any) {
  console.error("Cast failed:", e.message); // "Attempted to cast On as Off"
}

// Practical example: only adjust brightness for "On" lights
export function adjustBrightness(
  light: ReturnType<typeof Light.Off> | ReturnType<typeof Light.On>,
  adjustment: number
) {
  try {
    // Try to cast to "On" state
    const onLight = light.as("On");

    // If successful, create a new light with adjusted brightness
    const newBrightness = Math.max(
      0,
      Math.min(100, onLight.data.percentage + adjustment)
    );
    return Light.On(newBrightness);
  } catch {
    // Light is off, return it unchanged
    return light;
  }
}
