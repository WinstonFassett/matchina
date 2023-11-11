import { defineMachine, defineStates } from "../src";
// ---cut---
const states = defineStates({
  Red: 'means stop',
  Yellow: 'means caution',
  Green: 'means go'
})

const Machine = defineMachine(states, {
  Red: { next: 'Green' },
  Yellow: { next: 'Red' },
  Green: { next: 'Yellow' }
})

const machine = Machine.create(states.Red())

machine.send('next')

console.log(machine.getState().key)

