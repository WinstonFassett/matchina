# Hierarchical Machines - So Far

Working!

## DX Issues

- hard to follow the hierarchy in the code
- need static info about states - is final, what are defaults
- need better ways to compose

Should be a way to
- declare state keys 
- deckare state default params ie to get default data
- declare state finality
- declare submachines
- declare machine states or machines for states
- perhaps naming machines?

- maybe don't put machine on state? maybe name it?


How to define that Payment is/has a submachine?

How to statically define machien states?
Payment: submachine((...params) => createPayment(...params))
or
Payment: submachineState(createPayment(whatever, etc))

ok need a way to pass default params hmmm


Payment: requireSubmachine<ReturnType<typeof createPayment>>()

and later, 
Payment: () => checkoutStates.Payment(payment),
or do in transition

rename to setupSubmachines 

ah propagateSubmachines is redundant with outer/inner arg repetition

need better util methods / approach for getting type

withSubstates is actually the submachine func I want. Rename

am thinking about how to do substates.

machine.states.On().machine.getState().key

machine.getState().match({
  On: ({ machine }) => machine.getState().match({

  })
})

vs like

machine.getState().match({
  "On.Yellow": () => {}
})
machine.getState().key = "On"
machine.getState().fullKey = "On.Yellow"

Need a way to get the hierarchical keys off of a states factory.
or a machine

is hierarchical state a thing?
or is it a view over hierarchical machines?

Different scenarios:
1. true delegation to submachines
2. logical groupings of states and their transitions


Both logically amount to the same thing, most of the time.
Unless the submachines do surprise things
Whereas states hierarchy and transitions are constrained

wrapper machine vs extending machine?
not much difference

namespaced states?
namespaced event transitions?

Is the state really On or On.Yellow?
if It's On with a submachine in Yellow. that makes sense

flatten events, namespace states

In one scenario, there is no On, only On.[Color]
that also means cascading init states

composeMachine or flattenMachine

then how to do composed API?
flattened event names is doable in types
in impl would need to flatten transition events

hm = hierarchical(machine) // propagates submachines + derived flattened states and transitions
or maybe it is flattenDefs(matchine)
or rootMachine(machine)
or composeMachine(machine)
or facade(machine)



hm.states['On.Yellow']()
hm.transitions['tick']()
hm.tick()
state.key === 'On.Yellow'
state.is('On') === true
state.is('On.Yellow') === true
state.is('Yellow') === true
state.match({
  'On': () => {},
  'On.Yellow': () => {},
})

createToggleMachine(
  {
    Powered: submachine(() => createSignalController()),
    Unpowered: () => ({})
  },
  'Powered', 
  {
  }
)

the only good way to have state param / value defaults is if all args are optional


hmm what about
maybe there is a notion of states that include transitions
technically a stronger guarantee. 
HMMMMM
but how to do it?

SomeMachineState = parentState({
  states,
  initial,
  transitions,
})

maybe time for a MachineDefinition concept
{ states, initial, transitions }
defineMachine with that gives you an arg-free create func

createHierarchicalMachine({
  Off: undefined,
  On: {
    Yellow: {
  }
}, "Off", {
  "Off": "On.Yellow"
})

But that's sort of mixing concerns.


createHierarchicalMachine({
  Off: {
  
  },
  On: {
    states: {
      Red, 
      Green,
      Yellow,
    },
    transitions: {
      
    }
  }

})

ok and that works but won't have great type inference
not sure what would

On: submachineDefinition({
   states, transitions, initial
})

but could also do 

On: submachine(defineMachine(states, transitions, initial))

and that would have great type inference

With that we have a bunch of definitions
but can compose into a single machine with a single state and states factory 
instead of needing to do propagation across state machines

