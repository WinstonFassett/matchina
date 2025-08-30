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

## what remains?

* create elegant hierarchical machine factory (typed, handles propagation)
* write docs explaining HSM usage patterns

hsm checkout error on load:
matchbox-factory.mjs:66 Uncaught Error: Match did not handle key: 'Cart'
    at MatchboxImpl.match (matchbox-factory.mjs:66:11)
    at CheckoutView (CheckoutView.tsx:42:14)

routedFacade snuck in. what is it? how does it relate to other stuff?
we have a sep router project? was planning to delete this but deps on t are all over tests.

