# Hierarchical machine (1)inspection and (2)visualization (core inspection first, then viz UX)

We are on a series of branches building out hierarchical machines.

We have built a lot. We have examples. We have tests. We have docs.

We already have visualizers but they are not hierarchical yet.

This branch is round 2 (R2). We have another branch `hierarchical-visualizers-r1` with viz built out but had lots of issues, got rather hacky. So we are restarting from latest `hierarchical-machines` branch onto this `hierarchical-machine-viz-r2` branch. We also fell into a sort of trap of trying to do machine "definitions", an intermediate concept we don't have yet in this lib. We also worked out how to "flatten" a hierarchical machine definition into a flat definition ie with namespaced states and a single set of transitions and no submachines. It was cool. Was on quest to figure out how to do fullKeys. But some of those ideas were too much. Some useful, but a lot slowed us down.

The goal of R2 is to 
- tech design and build hierachical machine core to better support runtime inspection 
- TDD the core changes needed to support inspection
  - should have helper functions to create hierarchical machines with
    - `propagateSubmachines` baked in
      - MUST support infinite depth machines
      - unsure if it should do full traversal vs a chain reaction. Chain reaction seems better, requires testing
      - while resolving to transition, should propagate to states:
        - stack of states
        - depth in stack
        - fullKey of state
      - based on thoughts below, iirc, 
        - resolveExit (state) goes top down
          - as it goes, we know the stack (so far) and the depth
          - and the fullKey so far
          - when it returns, we will have the fully realized stack below the current depth
        - so in a sense there can always be the stack and depth, and the stack will populate as we go
      - hook into child machine transitions. 
      - consider scenarios where updateGrandchild is sent to root, level1, or grandchild. 
        - upper levels delegate down as part of resolve, part of their own top-level change
        - grandchild always handles it
        - propagate enhances resolveExit to provide additional context (stack, depth, fullKey)
        - propagate has full context and state with stack etc 
        - in the case where it is sent directly to the grand child, 
          - propagate should be listening to all active machines 
          - so it knows what level it is at
          - ie that it is skipping the first 2 levels
          - regardless, normal stuff happens, the machine changes state
          - propagate listener triggers on change
            - it needs to decide whether to bubble up (maybe. or maybe we always do it)
            - basically propagate listener here needs to trigger self transitions as a chain reaction
            - grandchild does transition, goes through lifecycle (send, resolveExit, transition, handle, before, update, leave, enter, effect, after)
            - or wait maybe not. i'm not super familiar with how we did/should implement this. need help covering everything
            - maybe it is disconnected. grandchild does not actually handle anything here, 
            - so there is nothing to bubble(?)
            - something instead, like when propagate sees an attempt to send on grandchild, it should send something to the root machine that propagates top down.
            - i.e. propagate intercepts "send" on descendants, but needs so send a thing that will cascade down.
            - probably something like child-change, which means do a self transition down to the target level
            - as a chain reaction
            - it sends child.change to root and its root send override triggers a self transition
            - because it has submachine that self transition should cascade down to level1
            - and level1 will do the same thing, cascading down to grandchild
            - but i guess child change event may need to carry the change event details or some params
            - because when it gets to a thing that has no children, that thing needs to know what to do. 
            - i guess yeah it should be carrying something like the original send args 
            - i think that makes sense

## Deferred          
  
- type and API support (EVENTUALLY - we did figure this out in R1, can circle back after impl works)
   
  
  
## Winston's thoughts talking through design and implementation concerns:

I should do test driven development
of course the type stuff is critical
but I've been splitting my focus
I think I should focus on implementation
and I should do tdd
and be deliberate
and careful
focus on definitions before instances
I have really mixed feelings about functional transitions
because they might either water
and are not inspectable
they are super cool
but let's remember these things are basically senders
I prefer string transitions
I should think about what I expect like the serialized definition of a
nested machine to look like
propagate State machines is unwieldy
I do think I prefer the idea of wrapping functional Transitions and something that makes them explorable
the bubbling should be straightforward
it is interesting to think about like the fetch machine which is not a persistent instance if it's going to get recreated it's just going to live
on that parent State and that's it
and that thing needs to propagate somehow
but how will we know to propagate it
something in propagate State machines probably needs to be aware of its entire current machine graph or I guess ancestor list
because it needs to be essentially attaching and detaching to those machines you know subscribing unsubscribing Etc
I'm not sure about pushing up to parents or parents pulling from children
I think I lean towards the ladder as I was just describing
machine States need to change but they're
top level Keys may not change at all
but also I do think something in the propagation should be smart enough to be
adding an additional property that's like a full key
that we can look at maybe
once I get everything working I can adapt over the inspector user interfaces like for the diagrams
it would be nice if the propagate State machines did the same stuff for the child machines and I think it should be able to
like
it listens in
for the
child machine to
make a change and when it does
it looks at the key
and then adds a full key property where it prefixes it with its own full key
that seems simple
okay I'm trying to picture a test
where we can test infinite depth
for each machine is basically the same it has like a pending an update and a done state
sub machines would go on pending
but they could also go on update if we wanted to try one of those
and then we test the change to the bottom ripples up to the top
we test the full key
of everything
when things bubble up it's not just about the name though
for the key it is
also got the actual States
do we need a way to do like state.def.machine?
where the deaf is not on the data
I think so
do everything is test so that there are no surprises in the UI
should the machine have a def or should it be a def?
putting on def would be more convenient
thinking about what I would like to see logged about the top level machine it should probably expose last change or something as a property for debugging
but then I would expect to see the definition of the machine and that should have States and Transitions and initial State as either the state or a function that creates the state
States in this case is the actual State Factory but it probably should also have a def
so I could do like
machine.death.states .death
or maybe the death stays on the state Creator function which would be a little bit more portable so it would be machine.deaf.states.statekey.death
in this world transitions would be not functional
but they would need to be strictly typed
well yeah I guess that's where like Handler
could come in
okay I think I'm back on board with the convig-based approach
let's remember there should be no snapshot and everything should be like the real States
we should treat them as immutable things
it's would be better off with this approach too like what if state definition included its key and its create function and info about it s Submachine
the search for example is a good one because it's like a permanent root machine contains in a permanent active Submachine that has a transient fetch Submachine
so what should that definition look like
root.def.states.active.def.machine-def.states.fetching.def.machine-def.states.Pending
and what do we do with that
that
I assume that when dealing with these nested State factories that if I create a state that it is going to be usually pretty agnostic of the other state factories
and that the propagation stuff is all in the machine the propagate machine logic so I think that these State factories would just return simple States and not hierarchical States ever right they'll be flat State factories not hierarchical State factories but we will have hierarchical state machines this does beg the question well how do we create the hierarchical states then
since child.exit implies success I wonder if it would be better to call a child done
that's just an aside
okay is there anything about this that doesn't work and a tech design sense
with the propagation I didn't talk through
how I want
and I said I want to have full key
but also I think we need something like a stack property that is basically the stack of
ancestors States
but actually no
like
what if we're sort of in the middle of this stack so to speak
it's more like
parents and
descendants
I don't know
like in a three level machine the middle state
like all of them are going to have the same full key for the state right
it's the middle state would be fetching right but the full key is active.fetching.pending
so I guess it should have access to the array of
states that that represents and maybe it's index within it
and that index is basically the depth
perhaps just call it depth and not index
what would we call it state.states sounds kind of weird
I guess I do like state.depth and state.stack
where the stack can be deeper than the depth
propagate should handle this such that other things consuming this stuff do not need to do a bunch of similar redundant traversals
also state that parent
and State
Child Maybe
or maybe that stuff goes on the stack
so it's like state.stack.items
state.stack.depth
but okay what about parent and child maybe those are logical things I don't know
don't need to overdo it
stack and depth gets it doesn't it
yeah I think it does
the biggest issue I had yesterday working on this for like something like 12 or more hours
was the state essentially getting stuck and this issue of having multiple machines and in the ux needing to like conditionally list you know use them with a hook and you know you can't really have conditional hooks so we have to use this maybe hook use machine Maybe
and it
it wasn't enough
to keep the ux updated with the full State key it kept on getting stale at certain points as it would Nest further down
if we're doing it right it should be dead fucking simple you just deal with the top level machine and you don't have to worry about anything else
but you can also listen to the middle level machines and and lower level machines and they should all have all the same context data like the stack
so that you don't need to do further traversals
that should make it really easy to stay current with the full State stack
now should definitions be aware of their depth I don't know
right now propagate submachines is a runtime concept I don't know if we need something like propagate Submachine definitions
I continue to think that flattening was a distraction it could even be separated into a separate PR and feature and I don't necessarily want to support it
something else that came up yesterday was like cloning stuff we were having the propagate sub machines like clone States in order to propagate things
in order to do it like a self State change on a parent
but I think the I do still think the propagate Submachine should handle the stuff and do it bottom up
usually I don't see the need to have a clone function
the parent machine should just listen to the Active Child and then do a self-transition on itself
when does the stack get added to the event
I think it should happen as part of a resolve
of resolving the exit
actually needs to happen later
I think
well we allow anything to change the event throughout any life cycle method it's like an event pipeline
arguably the event itself has a stack and is happening somewhere within the stack
originating from one part of the stack and affecting another part
okay so let's say we send an event
how soon do we know the target State stack for that event
we might be able to anticipate it from the definitions but our functional overloads allow anything
I think we need something like a chain reaction lots of chain reactions as opposed to like explicit recursive propagation
might need multiple chains I don't know
resolve exit and handle can both change the event
as in they can return a completely
different thing I think
different exit state
that's what it is
resolve exit is able to take the parameters to it and return the exit state
with nesting that exit state may have a you know machines or substate whatever
well I don't know okay wait backing up even further actually
we have
an entry State a from property on the change event
and that state may have a stack
and I think my hypothesis I guess reasoning through it
is that we can consider that to be the stack for the event
not sure what that buys us but just talking through it
anyway back to the question how soon do we have a stack on a new state
can we do transitions now is that when the event is sent we look at the innermost state
and move up the tree until we find a matching transition to handle
so it's depth first
now I think we were originally saying something like ours are probably good sub machines was going to like you know do this traversal down but I think no it's worth the way I just described which is that
we determine the stack
and then
we use that logic I just described to move up it and find the transition to execute
I think what I'm determining here is that this means that the stack will always be determined by the current state and will be less will be equal to or less than the current state in depth
that's a hypothesis
the stack gets deeper when states have submachines that's basically it
so the moment we've determined which transition to run we have resolved at a particular place in the stack from the previous state
okay so a hierarchical state machine send
will call resolve exit
and I think it should wrap resolve exit
with a hook
some point we call resolve next state
and that little helper function
looks up the transition
and then called resolve exit state with that transition
as a helper function that is
that function handles all the different types of transitions from playing keys to
functions and higher order functions
so let's assume we get just
a state key back
from the lowest level child Maybe
but that's where it calls the actual transition function
at that point is it aware of the stack
in a sense it's still working it's way down but it does know the stack context of the event which we've determined is a super set of that nested
thing
but we also said that like I mean you could have a transition that went into a nested State machine that had like a 10 levels of descendants of you know suddenly you just added 11 levels of nesting in one transition that's possible
I guess as you're going down
unless you want to do a bunch of pre-work you don't
you're building the stack as you go down
essentially
kind of
but when a transition runs
well let's just remember that by the time we call machine dot transition we already have a resolved event with a resolved exit state
within transition a guard hook can reject it
a handle
can replace the event
before can also replace the event
I think in these cases they are probably on their own for maintaining hierarchy stuff
I'm trying to think what an event log would show
like we're on a grandchild
just want to send basically a little change event that keeps us in the grandchild
so on Route we send update grandchild
level one do not have this transition
what would the log be something like
roots and update grandchild
root resolve exit update grandchild
and then resolve next state
this is root resolve next date
that basically looks up the transition
then it calls resolve exit date with that transition
rude so no stack
and it just calls the function
or get the exit stayed or whatever it basically from at that point like
whatever is the resulting state has some sort of
stuff on it and then
that
but we don't have a we're doing propagating down so actually
all that is bypassed because it's like oh look we have our state current state has a child
until it's like delegating
the send
to the child
and
you know and then if the child didn't do anything with it then it would
look at its own stuff
so I guess we see this
delegating sand and then we'd see
level one send
update grandchild
and at that point we'd have a stack we'd have
one element in it and
yeah
and then the level one machine has no transition for the grandchild so then it looks at its state or it looks at State first and then sees it has
a child state with a
grandchild machine on it
so then we see
grandchild send update grandchild
and
with a ancestors so it's not a stack here we don't have to pull stack we have his ancestors as we're going down
so when you get to the transition it makes sense you have ancestors but you don't know fully where you're going yet
this time the grandchild machine you know
has a transition that transition changes its state
and go through its various you know kind of notifications
but at what point should those notifications know the full stack
well I guess the moment we're at the bottom we know where we are in the stack
and
any node other things above that actually know where they are in the stack based on just the count of ancestors they have
I think maybe the stack is something that we're building
and we're just passing the same stack
around to everybody and it may not have everything in it yet that's another way to think about it
that could work
instead of a bunch of different ancestors arrays
so once we resolve a state that does not have a child machine
we are at the bottom State and we know what the stack is
or we know that we're done putting things into the stack
I think that means that when resolve exit comes back to the top level machine
and does it comes back to all the machines in between
it will have the full stack
yes I think that's right
resolve exit returns a state that includes
the complete stack
so we should see these inside out logs
grandchild resolved
exit
with the full stack and its debt
when we log in
then level one
resolved exit
then root resolved exit
meaning that in most cases as all other life cycle hooks are executed
we have a fully
realized State stack and graph
both
our inspectors are basically memorizing the diagram based on the machine definition and they aren't really reacting to you know much of the state graph except for essentially the stack
and using that stack to determine what things to highlight
there's a whole other art inspecting runtime machines that don't have definitions and unfortunately I'm going to have to worry about that because most of my examples are doing that in order to show visualizations
but then again the hierarchical stuff is brand new so maybe I don't need to worry about it too much
just with the existing hierarchical examples
and tests
we're already doing it but doing some tricks like the main tricks being that if we have functional stuff that we basically set it up to allow to have all optional parameters and that way our we can try cats just calling the transition and seeing what happens
without actually applying it to the machine
so it ends up being what if
I think when it comes down to supporting functional Transitions and supporting inspectability it's just going to be about well
yeah needing to use that approach we talked about where you specify the
key that you're exiting to and then a functional Handler
I think if you want things to be inspectable you just have to refactor to that and that's not that big a deal and it's better than creating a whole overwrought function wrapper thing