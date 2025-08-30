# hierarchical state machines so far

looking great!

## COMPLETED ✅ 

* ✅ examples import from 'matchina' not relative paths
* ✅ examples have good tw styling (replaced non-existent .btn class)
* ✅ checkout demo: fixed payment reentry (reset on changePayment) and back/exit
* ✅ hsm-searchbar: added autofocus and ESC/cancel, improved styling
* ✅ simplified child.exit API to cleaner syntax: `child.exit = ({ data }) => activeStates.Selecting(data)`
* ✅ improved xstate conversion to support nesting (detects child machines)
* ✅ kept propagateSubmachines in playground (not exported, experimental)

## what remains?

* better visualizations - need actual mermaid/react-flow implementation
* demo both nested and flattened approaches with real examples
* explore nuances between nested vs flattened patterns
* create elegant hierarchical machine factory (typed, handles propagation)
* write docs explaining HSM usage patterns
* make examples more expressive/compact
* figure out what to do about file uploader demo
* investigate "refine is weird" issue

