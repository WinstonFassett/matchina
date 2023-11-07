import { defineMachine, defineStates, withEvents, makeZen } from 'matchina'

const states = defineStates({
  Red: 'Stop', Green: 'Go', Yellow: 'Caution'
} as const)
const red = states.Red()

const def = defineMachine(states, {
  Red: { tick: 'Green' }, 
  Green: { tick: 'Yellow' },
  Yellow: { tick: 'Red' }
})
const machine = makeZen(def.create(states.Red()))
machine.tick()
const { state } = machine
const change = machine.machine.getChange()

const { to, from, type } = change

// Ways to type narrow:

if (from.key === 'Yellow') {
  const { key } = from
}

from.match({
  Red: () => {
    console.log('from red')
  },
}, false)

if (to.is('Green')) {
  const { key } = to
}

to.as('Red').key


