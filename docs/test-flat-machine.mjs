import { createFlatComboboxMachine } from './src/code/examples/hsm-combobox/machine-flat.ts';

const machine = createFlatComboboxMachine();

console.log('Initial state:', machine.getState().key);

// Check if transitions have metadata
const emptyTransitions = machine.transitions['Active.Empty'];
console.log('\nActive.Empty transitions:', Object.keys(emptyTransitions));
console.log('typed has _targets?', emptyTransitions.typed?._targets);
console.log('typed type:', typeof emptyTransitions.typed);

// Try focus
machine.send('focus');
console.log('\nAfter focus:', machine.getState().key);

// Try typed
try {
  machine.send('typed', 'test');
  console.log('After typed:', machine.getState().key);
  console.log('State data:', machine.getState().data);
} catch (e) {
  console.error('Error on typed:', e.message);
}
