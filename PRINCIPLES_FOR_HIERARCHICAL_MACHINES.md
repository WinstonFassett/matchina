
# Principles of Good Hierarchical State Machine Usage

## 1. Hierarchy Is About **Control Ownership**, Not Categorization

**Good hierarchy**

* A parent state *owns control*
* Entering the parent establishes invariants
* Exiting the parent annihilates all children
* Child states cannot exist independently

**Bad hierarchy (semantic grouping)**

* Parent exists only to “group” states
* Children don’t inherit behavior
* Exiting the parent does not meaningfully change control

> If the parent does not change *what inputs are allowed* or *who is in charge*, it is not hierarchy.

---

## 2. Use Hierarchy When Control Is Temporarily Delegated

Hierarchy is correct when:

* The system is “doing X”
* Something interrupts or refines how X is done
* Control returns to X afterward

This is the **exception / sub-machine pattern**.

### Good examples

* Picking → OutOfStock → Backordering → resume Picking
* Editing → Composing (IME) → resume Editing
* Typing → ValidationError → resume Typing

### Bad examples

* “Loading” nested under “Viewing” when both can exist independently
* “Buffering” under “Playing” if playback UI doesn’t actually change control semantics

---

## 3. Parents Should Define **Invariants**

A parent state should guarantee things like:

* Which inputs are enabled
* Which UI affordances are active
* Which hardware / APIs are in use
* Which transitions are legal

If a child does not inherit invariants from its parent, the hierarchy is suspect.

---

## 4. Exit From Parent Must Collapse Children

This is non-negotiable.

If you can:

* Exit the parent
* And leave a child “logically active”

Then you don’t have hierarchy — you have parallel or derived state.

This rule alone eliminates most flawed examples.

---

## 5. Prefer **Gerund / Activity Naming**

Good HSMs describe *what is being done*, not *what is true*.

**Good**

* Typing
* Editing
* Picking
* Backordering
* PrintingLabel

**Bad**

* IsValid
* HasShipped
* IsComplete
* Ready

Gerunds align naturally with:

* control ownership
* interruption
* resumption

---

## 6. Exceptions Are One of the Best Uses of Hierarchy

Exception handling is where hierarchy shines.

### Field validation (good example)

```
Editing
└─ Invalid
   ├─ Blocking
   └─ NonBlocking
```

* Invalid cannot exist outside Editing
* Resolution returns control
* Parent owns input handling

### Order fulfillment (good example)

```
Picking
└─ Exception
   ├─ OutOfStock
   │  └─ Backordering
   ├─ ItemDamaged
   └─ BinBlocked
```

This avoids:

* state explosion
* duplicated transitions
* illegal combinations

---

## 7. Avoid Hierarchy as “Namespacing”

This is the most common failure mode.

**Smell**

```
Open
├─ Loading
├─ Error
└─ Success
```

If:

* Loading/Error/Success can occur outside Open
* Or don’t inherit behavior from Open

Then this is **namespacing**, not hierarchy.

Better modeled as:

* parallel regions
* derived state
* workflow composition

---

## 8. Know What Hierarchy Is *Not* For

Do **not** use hierarchy for:

* Semantic status labels
* Business reporting states
* UI chrome (toolbars, spinners)
* Orthogonal concerns (telemetry, analytics)
* Dependency constraints alone (use dependency graphs / workflows)

Hierarchy is about **mode**, not **meaning**.

---

# Canonical Examples That Survive These Rules

## ✅ Combobox / Autocomplete (Best UI Example)

* Open owns keyboard, focus, navigation
* Typing / Navigating / Loading cannot exist unless open
* Closing annihilates all children

This is textbook HSM.

---

## ✅ Tags Input

* Editing owns input semantics
* Composing (IME), Deleting, NavigatingTags are subordinate
* Exceptions (duplicate, max tags) are nested and resumable

Excellent mid-complexity example.

---

## ✅ Field Validation (Exception-Scoped)

* Validation errors are subordinate to editing
* Resolution resumes editing
* No semantic overreach

Small but precise.

---

## ✅ Order Fulfillment (System Example)

* Picking, Boxing, Shipping are mutually exclusive modes
* Backordering is a delegated sub-machine
* Exceptions interrupt and return

This is a serious, defensible example.

---

# A Simple Litmus Test for Docs

You can put this verbatim in docs:

> **Use hierarchy only when a state temporarily takes control and must return control when finished.**
> If states merely describe *what is true*, hierarchy is the wrong tool.
