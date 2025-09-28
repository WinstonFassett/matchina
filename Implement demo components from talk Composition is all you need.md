Branch: react-composition

Goal: Create lib code and demo code that implements the concepts from Fernando Rojo's talk Composition is all you need.

***

## **Ontology of Components / Concepts from Fernando’s Talk**

### **1. Core Structural Components**

These are the building blocks that appear in every composer (simple or complex):

1. **ComposerProvider**

   * The root context provider for the composer.
   * Exposes state and actions to all children.
   * Handles global vs ephemeral state differences.
   * Can be swapped for different state backends (local `useState` or synced global state).
2. **Frame**

   * Wrapper for visual layout.
   * Typically includes border, padding, scroll handling.
   * Just UI; no logic.
3. **Header**

   * Usually static content (e.g., “New message” label).
   * Can include optional buttons.
4. **Input**

   * Controlled input component.
   * Stateless; reads from context to display current content.
   * Updates context actions on change.
5. **Footer**

   * Main area for action buttons.
   * Can be fully customized or composed from smaller units.

***

### **2. Shared / Composable UI Units**

These are the composable elements that live inside the footer or other areas:

1. **CommonActions / ActionBar**

   * Shared action buttons (e.g., emoji picker, plus menu, text formatting).
   * Rendered using JSX, not boolean props.
   * Can be overridden or left out entirely.
2. **Custom Buttons / One-Off Actions**

   * Cancel / Save buttons for edit message composer.
   * Forward button in forward message composer.
   * Each one uses context actions for state access.
3. **DropZone**

   * Optional drag-and-drop area for attachments.
   * Rendered conditionally via composition; no boolean flags required.
4. **AlsoSendToChannel**

   * Special extra component in thread composers.
   * Illustrates “edge case UI” that only exists in some composers.

***

### **3. Distinct Composer Implementations (High-Level Use Cases)**

These are **semantically unique demos** — each corresponds to a distinct demo or story in Fernando’s talk:

1. **ChannelComposer**

   * Uses global state (synced across devices).
   * Default UI layout with header, input, footer, common actions, drop zone.
   * Default actions: submit, emoji, plus menu, formatting.
2. **ThreadComposer**

   * Variant of channel composer.
   * Adds `AlsoSendToChannel` component.
   * Mostly shared internals; illustrates compositional extension.
3. **EditMessageComposer**

   * UI differences: no drop zone, limited footer actions (cancel/save, text format, emojis).
   * Overrides default submit logic.
   * Stateless props for ephemeral changes; shows JSX-first overrides.
4. **ForwardMessageComposer**

   * Ephemeral state (local, modal-based).
   * State is lifted to provider to allow “bottom row” buttons outside main composer.
   * Overrides submit / cancel actions imperatively.
   * Illustrates how context allows full compositional flexibility.

***

### **4. Action / State Concepts**

These are **conceptual entities** more than components:

* **State**

  * Either ephemeral (`useState`) or global/synced (`useGlobalChannel` hook).
  * Shared via `ComposerProvider`.
* **Actions**

  * Default API (send/submit, update, cancel, etc.).
  * Can be overridden imperatively inside provider.
  * Passed to all children via context; children don’t care how they’re implemented.

***

### **5. Key Patterns / Takeaways to Port**

1. **Composition-first**

   * Use JSX for flexible layout.
   * Avoid boolean props controlling rendering.
2. **Context + Provider**

   * Single source of truth for state/actions.
   * Children consume state/actions via hook (`useMachine`).
3. **Shared / Reusable Units**

   * CommonActions / ActionBar.
   * Other “internal” components that are composable.
4. **Ephemeral vs Synced State**

   * Illustrates how provider can adapt to different backends.
5. **Imperative Overrides**

   * Provider can override actions.
   * Allows buttons outside the composer to trigger submit/cancel without lifting state up unnecessarily.

***

### ✅ **Summary Table**

| Concept Type     | Name / Demo                     | Key Feature / Distinction                                |
| :--------------- | :------------------------------ | :------------------------------------------------------- |
| Provider         | ComposerProvider                | Passes state/actions via context; can swap backends      |
| Layout Component | Frame                           | Visual wrapper                                           |
| Layout Component | Header                          | Static header / optional buttons                         |
| Layout Component | Input                           | Controlled input reading from context                    |
| Layout Component | Footer                          | Container for buttons / actions                          |
| Shared UI        | CommonActions / ActionBar       | Reusable action buttons                                  |
| Shared UI        | DropZone                        | Optional drag-and-drop                                   |
| Shared UI        | AlsoSendToChannel               | Only in thread composers                                 |
| Demo / Use Case  | ChannelComposer                 | Synced global state, default layout                      |
| Demo / Use Case  | ThreadComposer                  | Adds AlsoSendToChannel, mostly shared internals          |
| Demo / Use Case  | EditMessageComposer             | Limited actions, cancel/save, JSX-first overrides        |
| Demo / Use Case  | ForwardMessageComposer          | Ephemeral state, modal, bottom-row buttons outside frame |
| Actions / API    | Default actions / submit/cancel | Passed via context; can be overridden                    |

***

So conceptually, you have **four main distinct composer demos** (`Channel`, `Thread`, `EditMessage`, `ForwardMessage`) and a set of **building block components** (`Frame`, `Header`, `Input`, `Footer`, `CommonActions`, `DropZone`, `AlsoSendToChannel`) that can be composed in different ways. Actions and state live in the provider context, allowing full override flexibility.
