# hierarchical state machines so far

looking great!

## what remains?

* better visualizations / controls / examples
* demo both nested and flattened
* explore nuances between them
* make sure we did not miss anything

### Better visualizations needed for HSM examples

* what can do nesting? mermaid? react-flow? custom?
* let's get something in place. mermaid is probably best bet near-term
* need conversion to xstate to support our nested stuff
  * could probably improve it now with our nesting infra in place
  * and ofc mermaid conversion from xstate also needs to support nesting 

## Issues

* none of these hsm demos are dear to me.

  * checkout demo

    * reenter payment does not allow redoing payment
    * back and exit are not working. thought we were going to allow those, but child wins
  * file uploader has never worked for me. dunno if it makes sense.
  * hsm-searchbar is the least bad and it's not in the astro config for the sidebar.

    * common transitions hmm
    * empty has no query. is empty
    * needs esc/cancel.
    * should autofocus when input appears.
    * it is also not complete from a ui perspective
  * examples have not been revised since last round of hsm enhancements. tests are more sophisticated.
  * examples lack good styling. need to either do good tw styles or create classes with good tw styles.
* how should child.exit work?

  * can it be simpler, not require args? just be a string key mapping?
  * how elegant can we get that?

    * child.exit = ({ data })) => activeStates.Selecting(data)
    * for example
* refine is weird
* can we create hierarchical machines elegantly yet? ie use something that handles propagation, returns typed thing?
* still need docs on hierarchical machines (nested, flattened) that explain usage, refer to examples
* maybe we should not export propagateSubmachines

## generally

* examples should import from 'matchina' not relative paths
* always prefer string keys over custom funcs when possible
* figure out how to make examples more expressive / compact / less verbose.

  * do things to minimize conversions, needs for functions and allow native passthru with type support to dominate

