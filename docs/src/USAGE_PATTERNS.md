# Usage Patterns

See readme.

Mainly we createStates() and defineMachine(states,transitions, initialState)

transitions can map to state keys or to functions that can take parameters
transition functions can return states or they can return a function 
which accepts a change event and returns a state.

This is great for strongly typed params and payloads. 

But. What about patterns that are uniform? What might that enable?

For example what if we define the states as all taking the same args and/or having the same data payloads?

Should we have a name for these things? Do they have benefits?


