We are on a branch off of hierarchical-machines that attempts to improve DX while preserving the enhancements of hierarchical-machines.

Specifically this branch adds definitions and flattening. It has been a long road and is kind of a mess.

First thing, review log, then diff head with source branch. Then write HIERARCHICAL_MACHINES_R2_CODE_REVIEW.md. Be suspicious of large files and duplicate code, be suspicious of any changes to core deps like factory-machine. Flag unnecessary or duplicative code.

Feel free to review the md docs in the root about hierarchical machines for context. Would be good to clarify where we are landing. 

Once code review is done go ahead and make all changes to cleanup, simplify, etc. Look for cruft including in tests. Not sure if all these hsm tests are needed. Better to eliminate dupes now and we can bring back later if necessary when we review test coverage.

As final step, once everything is good, run npm run test to look at coverage and add test coverage notes to review md along with any steps that should be taken to address inadequate coverage anywhere. 

---

Ok the review found that AI engineers hacked the tests instead of implementing correct typing.

That is a huge deal. It means this branch does not really work. For the generics.

Without the generics this is possibly not worth doing. We must work in the spirit of the library.

The review says:

> The type system cannot automatically infer submachine types from runtime objects:

I do not follow. 

This is not valid usage imo:

Working: Child as { machine: typeof Child },


The whole idea was to wrap it in a func that preserved generics. I thought we could do that.

Working: defineSubmachineStateFactory(...)

That should work? Unless we need to specify as const somewhere or something.

I have gotten a long way in this lib with very elaborate generics and I'm usually right about what is possible.

Agree API design is schizo. Implementing definitions after instances is a little backward.

I don't need to defend any code in this branch because it's vibes, not mine.

I need to understand runtime type erasure. I don't really care about runtime. We have different ways to make it work at runtime. But the types will be valid.

> Accept explicit typing** - Require users to explicitly type submachine references

I would need an example to be sure, but I am probably against this. 

The whole purpose of this lib is amazing type inference and not needing explicit typing on our stuff because it is inferred.

> **Build-time code generation** - Generate types at compile time (complex tooling)

No. Should not be necessary.

**Abandon compile-time flattening** - Make flattening runtime-only with simpler APIs

No. it should be possible. we have gotten very close. We may have even gotten it. We have been through several iterations. We have gotten all the tests to pass multiple times. 

So I disagree wiht the strategic direction almost entirely.


No. The strategic direction should be to rip out any cheating/casting from the tests and make the tests real, and make the types work.

You must not be vague and hand wavy about runtime type erasure. We are talking about build-time. in the IDE. If we are losing types due to some exotic feature of TS then I need you to explain it in detail with the specifics.


---

older:

This branch was vibe-coded. Meaning it is YOUR code, not the user's.

Do a git diff of head and hierarchical-machines to see how we have refactored.

It should support both the nested machine approach and the approach
that flattens a nested machine or def into a single machine/def with no submachines.

It has been a pain in the ass getting here. 

It is very messy.

On the plus side you wrote some type tests and I had nothing like those. I want to have type tests. In many cases they would be more helpful for tracking down issues than the usage tests. The generic typing is more complex than the implementation in most cases.

With hierarchy there is some complexity but its all deterministic and we just need to make sure we handle all edge cases.

The AI's have invented concepts that are not mine. "snapshot" and "dummy" are not things I usually deal in. I am suspicious of them.

For one thing, my machines already effectively snapshot their states which are already immutable and they track a change event { type, from, to }

States are objects with typed keys and typed data payloads for each of those keys.

Review the git log going back to hierarchical-machines branch.

We got things working after several revisions, then started doing code cov and uncovered more issues.


Something in this code is allowing machines to get into invalid states. That should be impossible.

We must not allow invalid states. Ever. The lib should not, in most cases need the overhead of checking. As long as the lib itself is not doing the wrong thing. So for this we need to add validation to wherever we are doinging transition in order to figure out what is allowing our machines to get into an invalid state. We must never do that. Ever. Not for a moment.


