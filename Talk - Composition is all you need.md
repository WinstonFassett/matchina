[Music]
[Music]
This conference is brought to you by
Callstack, your React and React Native
development experts.
[Music]
Is this as good as it gets?
You build a form for creating a user and
it works great. And then down the line,
you need a form for updating user. So
you add a boolean prop to your generic
user form is update user. But update
user has some differences.
It sets the initial state to the
existing user and it shouldn't render
the welcome message or terms and
conditions. So you pass a boolean for
each of those to hide them. Oh, and uh
when the mutation succeeds, it shouldn't
redirect to onboarding.
And then it happens. You need a
component for only updating the user's
name. So maybe you create an update user
name component
and you pass only edit name as a prop.
And maybe you need to set is slug
required to false. And I know if you've
written React for long enough, you have
a lot of code that looks like this. And
I'm sure you don't like peeking inside
of user form because it's a complete
mess. And the question is, is there a
better way?
And to illustrate, I'd like to examine a
complex UI component that we're all
familiar with. Slack composer.
How would you build this? Now, I don't
have any idea on how they actually
implemented it, but whenever I use a
product this often, I can't help but
wonder. How do they organize this UI?
And how do they handle the state
management? On the surface, this
component may seem simple, but it comes
in many forms. It's used in channels and
DMs, DM threads, channel threads,
forwarding a message, editing a message,
and a few more.
Each implementation has its subtle
differences from logic and UI. For most
of the composers, the state is actually
global and as you type, it's synced
across devices. But for one like
forwarding a message, it's actually
ephemeral.
Now, over the years, I've seen hundreds,
maybe thousands of React code bases,
articles, and tutorials. I have seen
your code, and I've seen what AI outputs
when you ask it to build with React. So,
to start, I'll show you what I think the
typical approaches to building a
composer like this. And by the end, I
hope you'll come away with a more
enjoyable way to write React. One that
makes both humans and AI agents
productive, even as a codebase gets
larger.
As you build a composer, you'll probably
start with something like this. You have
a header, input, and footer.
And in your channel, you simply render
it and pass it on. And it looks simple
enough. And so our composer for channels
is complete. But what about sending
messages in a thread?
Well, I'll create a thread composer and
I'll just swap out the submit function
and we're good to go, right? But wait, I
know you've seen this. The channel and
the thread have this tiny difference.
The thread composer has this little bar
here which says also send to channel.
When you check that box, it also sends
your message back to the original
channel.
We have to account for this in our
composer. So maybe you'll just throw in
an is is thread prop and of course a
channel ID and it's pretty harmless,
right? The thing is we have two
different kinds of threads to consider
DM threads and channel threads. On the
left it says also send as direct message
and on the right also sent to channel.
So how would you organize this logic?
You'd probably add another condition
like is DM thread and DM ID and it just
it just keeps going. Now, maybe you add
some TypeScript tricks to avoid
impossible states with unions, but we
just know it's going to be a mess and
you have to handle this with yet another
turnary.
It's a bit messy, but you think, you
know what, looks good to ship. We now
support threads, channels, and DM
threads.
But wait, now we need to do edit
message.
And there's always that that one
component that really ruins the day. The
one with 30 conditions that you have to
check all over the place. And that's
what edit message is about to do. On the
left, we have our channel composer from
before. And on the right, edit message.
And see if you can find the key
differences between them. First, in the
footer, our actions on the left aren't
the same.
In the edit message, we only have format
text and emojis. And in the bottom
right, we have entirely different ways
of handling submit. Now, it's important
to note that when the plus icon on the
very far left is missing, that means you
can't add attachments. So, for edit
message, since we don't have that little
plus icon, it means we also have to
disable dragging and dropping.
And how hard can that really be to
implement? Well, this is the composer we
have now. And most code bases I've seen
would add yet another condition. So,
first we'll disable the drop zone for
dragging files. And we'll pass a boolean
to our footer to make sure make sure it
knows which actions to hide. And
obviously, if you can tell by my tone, I
I don't love this code, but I promise
something is better. So, we'll continue
with the footer. Right now, our footer
has actions and submit. It's very
simple. But, we need to filter out
certain actions when we're editing a
message. And here's the thing. I know
what you might want to do here. you'll
probably just have an array of actions.
And over time, that array keeps needing
keeps having to handle more and more
cases. You add something like is menu
true and divider true and a menu items
array, but only in some of the items.
And you just know the implementation
that loops over those actions is a
disaster. So, okay, now we need to
handle this is editing message pooling.
And this is where it starts. We hide the
plus icon, we hide the mentions,
everything after it. But what if we just
used JSX?
We can ditch the array and create a
distinct component for each action. And
under the hood, each one of these can
implement a shared button. But it's easy
to escape to something custom when you
need it, like the button all the way on
the left, which has a bit of a different
style. I'm yet to find a better
abstraction than just using JSX for UI.
I always come back to it. Now, handling
this boolean is still a mess, and you
could wrap everything in a fragment to
give yourself the illusion that the code
is maintainable. But at this rate, who
knows how many more conditions we're
going to add. Oh, and uh one more thing,
the actions in the bottom right for
editing are cancel and save, which is
totally different from the original
composer, which is just this little icon
button. So, how would you handle that? I
think I know. I think that in our edit
message composer, you might add uh on on
cancel prop. Yet another optional prop
that we now have to handle and pass all
the way down to our footer. So here in
the footer, we basically lose this
simple submit button and add another
condition with more and more complexity.
And just imagine if you have 20 more
cases like this.
If you're using the same condition this
often all over the place in the same
component, you may have found a good use
case for composition.
In fact, if you have a boolean prop that
determines which component tree is
getting rendered from the parent, you
can kind of imagine me looking over your
shoulder and shaking my head. Now, maybe
you can refactor this in a way that
feels a little bit simpler with like a
render submit prop, but this won't
actually work for every composer, as
you'll see in a little bit. And this is
a story of many React code bases. As
they get bigger and their one-off
components get reused in all different
ways, it becomes hard to work in. I've
seen this for both humans and AI. But is
there a better way? Can we scale our
code bases while retaining the
flexibility, but without making it hard
to work in? Can we build in a way that
both humans and AI can succeed? Well,
let's look at one more instance of our
composer forwarding a message. Here we
have yet another implementation with its
own subtleties. The actions in the
bottom left, well, they're almost the
same as the edit message composer,
except the forward button is a little
bit different in the bottom right.
There's nothing there. And forwarding
also has a mentions icon in the bottom
left. Yet another condition there to
handle.
So, we need a way to pass our form state
up to the parent for those buttons at
the bottom to access it because notice
that the submit is not inside that
composer box. It's totally separate. So,
do we once again add another boolean
prop like is forwarding message and then
find some way to set state from our form
back up to the top so that it goes all
the way to this forward button which is
outside of the composer. Well, if we do
that and we keep expanding the API,
we'll end up with a composer that looks
like this. Quite a nightmare to work on.
So, instead, let's try something new.
What if we built our features like
radics components?
Instead of this channel composer, which
renders a monolith with a giant list of
optional props, what if we split it up
starting with the composer provider?
And then we can just simply add in the
frame, the header, the input, and the
footer.
And lastly, to support drag and drop,
we'll just have a dedicated drop zone
file. And that component gets rendered
here without a boolean. We don't need
any special checks. We just render it or
we don't. But given how much
customization our footer needs, let's
open it up. And inside of it, we'll pass
our submit button, which shows at the
end. And then we add our actions. Here
we have the plus menu, emojis, text
format, and more. Now, it's a lot to
show on screen, so I hit it. But the
thing is, many of our composers actually
do use the same actions there in the
bottom left. So, let's combine these
into a component called common actions.
This is what our channel composer looks
like. Now, we have a provider at the
root, a drop zone, frame, header, input,
and footer. And what do common actions
look like under the hood?
Well, it simply wraps our existing
compound components. This way, we get a
reusable monolith for the composers that
need it. But the crucial part is that we
can always escape out to render
individual items. And notice that common
actions doesn't receive a prop like is
editing message. It doesn't have to do
any complex checks itself. Keep that in
mind because it'll be relevant soon. So,
let's continue with this approach.
Let's rebuild our composers using
composition. I was worried I might mess
that one up. Back to the code. If this
is what our channel composer looks like,
what would our channel thread composer
look like? Well, the only difference
here is this also send to channel
component. So, I'll create a new thread
composer where the only difference is
the name. And the last thing we need to
add is also send to channel. Everything
else is the same. And this is all we
need. And where are the booleans and the
special props from the top of the tree
telling us what to render? They're
nowhere to be found. We don't have a
monolith. Instead, we have shared
internals that get reimplemented for
each use case. And when you have
something you want to abstract, such as
footers, common actions, of course, you
can, but we don't always need to. All
right, but anyway, those were the easy
ones. What about the edit message
composer? Well, just like always, we'll
start with our provider. We'll add in a
frame, header, and input. We will not
add the drop zone here because editing
messages does not support attachments.
There's no boolean to determine this. We
just don't render it. And the last
missing piece is the footer. Now, this
is where things got a bit dicey in the
previous composers. And the question is,
how do we implement this? Any complex
checks or props to pass down through a
bunch of components? Well, if you look
at the footer in the UI on the left, we
have only text format and emoji actions.
So let's just render those. We can
simply reuse our components we created
earlier. Instead of using common actions
and passing it some prop, we can just
use JSX directly. And what about our
cancel and save buttons in the bottom
right? Well, those are one-off
components only used by this composer.
So we can just render buttons. We don't
need some render submit or anything
complicated like that. You can just
render JSX.
no set of millions of props or all these
different things. We have completely
distinct React component trees which
just rely on JSX to render. And suddenly
our our code looks like a work of art.
And you can imagine that it would almost
be hard for AI to hallucinate here.
But what about state management? This is
the part that I've left out up until now
because there are many valid ways to
handle this. But I'll show you a general
pattern that I like to illustrate. Let's
move on to the forward message composer.
Something unique about this component is
that its state is local. It's rendered
inside a modal and if you dismiss that
modal, Slack will warn you that you're
going to discard the draft. And that is
unlike all the other composers we've
seen. You see the other ones as you type
in the composer, it will actually sync
between your phone and your computer. In
some cases, the state is synced across
devices. In other case, it's entirely
ephemeral. So we not only have to
consider these little differences in UI,
but also the fact that the exact same
component could have entirely different
implementations of state management.
So let's implement it to see how it
works. Here's our forward message
composer using our shared things like
the header, input, footer, and three
actions. And once we close this
dialogue, that text should not save. So
how do we handle that? Well, that's
where the provider comes in.
The context provider defines the common
interface used by its childrens
including state and actions. But the
implementation itself is only handled by
the component which renders the
provider. Since our forward message
modal is ephemeral in this case we can
just reach for use state. The provider
will also define generic actions like
updates and in this case we implement
that with set state. But in other cases
you could actually use any state handler
you want here.
I even like passing a meta property for
anything that lives outside the internal
state. For example, you could add an
input ref here. Now any component can
easily focus the input and you don't
need to pass it down through a bunch of
weird places or use imperative handle.
You just have it in your context. And
the specific naming here just comes down
to preference. And so how does this look
in practice? Well, the composer input
simply uses the context and renders from
there. The input is actually agnostic to
the state and actions and how they're
implemented. It just renders it based on
the shared context. And if you're
worried about frequent rerenders from
React context, just use the React
compiler. Really, it's fantastic. I
actually could give a whole talk on all
the little amazing optimizations the
React compiler gives us. Um, and to
prove it to you, I I actually pasted
this component into the React compiler
playground, which is a really cool tool
that I I just use all the time because
it's it's pretty crazy to see what it
does. And even though the compiled
output here is a bit hard to read, I'll
let you take a look to notice that it
actually does memorize this input based
on only the inputs that we access from
the context.
Okay, back to our provider. It looks
like this where I also had added a
submit handler to forward the message.
And so that's the only hook that's
really sending anything to the network.
And just like before, we render our
header, frame, input, and all the custom
actions in the footer.
But wait a minute, what about that row
of buttons all the way at the bottom?
They are rendered outside the composer.
So what do we do?
Do we have to send state from our
composer back up to the parent in a use
effect? Or do we have to have some
shared ref that we call onsubmit which
checks the form state? Well, of course
not. You see, zooming out, this is our
code right now. And how can we support
this row of actions down at the bottom?
Do we need some kind of render function?
Right? If we pass render footer, well,
that wouldn't work because that
component didn't have anything to render
down there.
Instead, we need to lift our state. And
if there's one thing to take away from
this talk, it would be this. I've solved
so many problems in my React code bases
by simply lifting state higher up in the
tree. In practice, that means taking our
provider and pulling it into its own
component, which receives children. Then
we pass forward message composer as a
child of the provider. And below that,
we can render our message preview
component and our actions. And what's so
special about this? Like, doesn't this
just look like regular React code? Well,
here's the key. The forward button at
the bottom
can just use the submit action from the
context without being inside the
composer
because it's within the composer
provider, though not necessarily within
the composer frame. It has actions
access to all the composer's actions and
logic. I'll say this again. The row
below the composer, which is not inside
the composer box, can still access its
state and actions. There's no need to
pass things back up and back down or
have any kind of weird thing like on
form state did change. Just like that,
we can escape out of our default
implementation into a customized one
without a heavy lift. We lifted our
state and composed our internals.
Our final code really looks beautiful.
We render UI in the forward message
composer which reuses some of the
composers components but not all. We
have an unrelated message preview
component which can render under it
without any weirdness. And we have our
custom actions at the bottom which use
the composer's state and actions but are
entirely isolated from its UI.
So how might we do the same with the
original channel composer?
Well, the question is where do state and
actions come from? Use state from React
will not work here because our channel
composer actually has its state synced
across devices.
So, I'll import a hook called use global
channel. And this hook is in charge of
sending messages and syncing it up
across the back end and even across
devices. And as long as it returns
things which can conform to the
interface used by the context, it works
with this component. The implementation
is decoupled from the interface here.
And we can swap out our state management
with ease.
Now in our channel composer, all we need
to do is swap out this root provider
for our new channel provider. And all of
its children will now use state that is
synced across devices. And if you ever
need to change your state management for
this entire composer in any one of those
implementations, you just have to do it
in one place. This is instead of having
a global hook that your comp that your
composer actually queries inside the
component and then you need to do a
bunch of boolean checks within that
component. It all lives at the root
provider.
Now the question is does this matter if
AI is going to write our code for us?
Are these things just little details
that are just days away from becoming
irrelevant?
I would argue that on the contrary,
regardless of where software ends up,
the way we instruct it is critical.
Suddenly, as I've been using AI more and
more, a good code base feels more
important than ever. Lately, I've been
building the mobile app for Vzero, and
I'm spending so much of my time looking
at AI outputs for React. My side project
is chess zero, a chess app I built with
built with Vzero using only my voice
when I go on walks. And I've been
feeding Vzero slides from this talk,
prompting it to rely on composition for
state management and rendering.
And I've been amazed at how successful
it's been at writing fewer bugs.
Perhaps best of all, I I love editing
the code. For the first time, I found a
way to not only vibe code, but pair
program with AI. And if you're
interested in seeing the props I use,
you can follow me or reach out on X and
and I'll share them there.
So the next time you're 15 booleans deep
into your component props, just remember
composition is all you need. Thank you.
[Music]
Heat. Heat.
[Music]

