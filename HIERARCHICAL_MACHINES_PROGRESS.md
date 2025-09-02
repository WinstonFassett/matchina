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
* ✅ **removed file uploader demo** - wasn't particularly expressive of HSM patterns
* ✅ **made remaining HSM examples more expressive/compact** - cleaner syntax, better comments showing hierarchical structure
* ✅ **fixed all build errors** - resolved type issues in HSM examples
* ✅ **investigated "refine is weird" issue** - syntax was correct: `() => (ev) => ...` for parameterless actions 
* ✅ **explored nested vs flattened patterns** - nested = child instances (encapsulation), flattened = dot-notation keys (efficiency)
* ✅ **verified examples work in browser** - hsm-searchbar shows hierarchical state display and full functionality
* ✅ create elegant hierarchical machine factory (typed, handles propagation)
  - seems ok. only using on checkout so far. 
  - need to really evaluate our usages in tests and examples and consider what makes most sense
  - want good coverage demoing options but want to use sanest option(s) for given example
  - ok i think we are good on the lib design, not sure about examples
* ✅ write docs explaining HSM usage patterns, referring to examples, funcs, types etc
