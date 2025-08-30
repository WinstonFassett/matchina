We are on a branch off of hierarchical-machines that attempts to improve DX while preserving the enhancements of hierarchical-machines.

Specifically this branch adds definitions and flattening. It has been a long road and is kind of a mess.

First thing, review log, then diff head with source branch. Then write HIERARCHICAL_MACHINES_R2_CODE_REVIEW.md. Be suspicious of large files and duplicate code, be suspicious of any changes to core deps like factory-machine. Flag unnecessary or duplicative code.

Feel free to review the md docs in the root about hierarchical machines for context. Would be good to clarify where we are landing. 

Once code review is done go ahead and make all changes to cleanup, simplify, etc. Look for cruft including in tests. Not sure if all these hsm tests are needed. Better to eliminate dupes now and we can bring back later if necessary when we review test coverage.

As final step, once everything is good, run npm run test to look at coverage and add test coverage notes to review md along with any steps that should be taken to address inadequate coverage anywhere. 

---

Ok the review found that AI engineers hacked the tests instead of implementing correct typing.

That is a huge deal. 