# Nested Route Transitions — Spec and Failure Journal

This document defines the desired behavior for nested route transitions and records the recent failures, suspected causes, and a restart plan.

## Goals

- **Hierarchical gating:** Only the level that changes animates. Parent/sibling levels stay static.
- **No flicker/dupe:** No duplicate DOM flashes or first-frame clipping; no layout jumping.
- **Animation modes:** slideshow, slide, circle, square (diamond), gradient.
- **Pointer-origin reveals:** Shape reveals originate from the click position, per-container.
- **Param-only transitions:** Route param diffs at a scope trigger transitions.
- **Clean layering:** Next layer above previous during change; previous fades.
- **Scoped debug:** Debug visuals toggle-able and strictly scoped.

## Division of Responsibility

- **React/JS (`docs/src/code/examples/router/viewers.tsx`):**
  - Compute `scopeChanged` from `viewKey`/`prevViewKey`, or from `match` vs `prevMatch` names + params.
  - Keep previous children until `transitionend/animationend` (or a timeout) when `scopeChanged`.
  - Apply container attributes:
    - `data-vt-dir="forward|back|replace"`
    - `data-vt-mode` (resolved from context for the current direction)
    - `data-vt-changing="1"` only while an exit layer is mounted
  - Compute per-container `--origin-x`/`--origin-y` from last click pixel coords clamped to container bounds.
  - Use distinct React keys (`prevViewKey`/`viewKey`) to avoid subtree reuse and duplicate flashes.

- **CSS (`docs/src/code/examples/router/transitions.css`):**
  - All selectors are container-scoped using the viewer’s attributes. No global `html.*` gating.
  - Only animate under `[data-vt-changing]`.
  - Exit layer: fade only. Entering layer: run the mask/clip animation as needed.
  - Maintain z-index so next stays above previous during the change.
  - Containers clip their content and use `contain: paint` to confine reveals.

## DOM Structure Per Viewer Level

```
<div class="{classNameBase}"
     data-vt-dir="forward|back|replace"
     data-vt-mode="slideshow|slide|circle|square|gradient"
     data-vt-changing>
  <div class="{classNameBase} transition-reveal is-previous-container"> ...prev...</div>
  <div class="{classNameBase} transition-reveal is-next-container"> ...curr...</div>
</div>
```

## Layer Positioning

Pick one approach globally and keep it consistent:

- **Grid stacking (safer when parent defines height):**
  - Container: `display: grid; grid-template-areas: "stack"; position: relative;`
  - Layers: `grid-area: stack;`

- **Absolute stacking (requires explicit parent height to avoid collapse):**
  - Container: `position: relative;`
  - Layers: `position: absolute; inset: 0;`

Regardless of approach, layers should have `overflow: hidden; contain: paint;` to confine reveals.

## Z-Index Policy

- During change: `.is-next-container` above `.is-previous-container`.
- After change: previous is unmounted.

## Mode Behaviors

- **slideshow:** Next slides in fully; previous slides out; minimal/no fade.
- **slide:** Shorter translate with fades (snappier than slideshow).
- **circle:** Entering layer reveals via `clip-path: circle()` from `--origin-x/y`; previous fades. For back, previous reveals instead.
- **square (diamond):** Same pattern with `clip-path: polygon(...)` expanding from origin.
- **gradient:** Only the animating layer gets `mask-image`; forward RTL, back LTR; previous fades.

## Gating Rules

- Only apply any mask/clip/translate under `[data-vt-changing]`.
- Initial clip-path/mask only while changing to avoid first-frame hidden content.
- No animations if `scopeChanged === false`.

## Pointer-Origin Rules

- Compute origin per-container using last click coordinates (pixels), clamped to the container bounds.
- Fallback to center if outside container bounds.
- Expose as CSS vars `--origin-x`/`--origin-y` in percentage units (e.g., `37%`).

## Param-Change Triggering

- `viewKey` should include route params (JSON). Any param diff at the scope triggers a transition.

## Nested Scoping

- No global HTML classes to control mode or change state.
- CSS must target only the current viewer container `[data-vt-*]` and its direct `.transition-reveal` children.

---

# Failure Journal (What Broke, Why It Broke)

- **Symptom:** Product tabs appeared side-by-side; no transition.
  - **Likely cause:** Layers not actually stacking (grid not applied to container, or absolute overlay used without ensuring parent height). Conflicting CSS where container/layers didn’t share the same stacking area.

- **Symptom:** Flicker and duplicate content flashes.
  - **Likely cause:** React reused subtrees (keys not distinct); or both previous/next were animated/masked simultaneously; or masking applied beyond `[data-vt-changing]`.

- **Symptom:** All levels animated together (hierarchy broken).
  - **Likely cause:** Global `html.to-*` / `html.is-changing` gating; not scoping mode/change to specific containers.

- **Symptom:** Gradient blink.
  - **Likely cause:** Mask applied to both layers. Should only be on the animating layer per direction.

- **Symptom:** First-frame hidden content (flash when idle).
  - **Likely cause:** Initial clip-path present outside transitions. Must be gated by `[data-vt-changing]` only.

- **Symptom:** Pointer origin reveals misaligned.
  - **Likely cause:** Using viewport-based origin without adjusting for container bounds; missing per-container origin compute/clamp.

- **Symptom:** Content not rendering after CSS changes.
  - **Likely cause:** Switched to absolute overlay without guaranteeing container height, or removed grid without replacement, collapsing layout and hiding content.

---

# Restart Plan (Minimal, Safe, Test-Driven)

1. **Reset to known-good branch.**
2. **Pick one stacking model and lock it in (prefer Grid):**
   - Container: `display: grid; grid-template-areas: "stack"; position: relative;`
   - Layers: `grid-area: stack; overflow: hidden; contain: paint;`
3. **Scope-only CSS:** Replace any global selectors with container-scoped `[data-vt-*]` ones. Do not touch layout CSS outside the container.
4. **Gate animations strictly:** Ensure all animations run only when `[data-vt-changing]` is present. Keep initial clip/mask only while changing.
5. **Keys and exit lifecycle:** Confirm `viewKey`/`prevViewKey` include params and differ on tab/param changes. Keep previous layer until end events (or timeout).
6. **Per-container origin:** Re-apply origin compute in `SlideViewer` and clamp to bounds.
7. **Test matrix:**
   - Nested routes (parent + tabs) in all modes.
   - Param-only route changes.
   - Forward/back navigation for circle/square/gradient (verify inversion & mask-on-one-layer).
   - Resize/scroll sanity (origin still reasonable).
8. **Debug visuals:** Gate by `html.vt-debug` and show only on the active viewer container.

---

## References

- Viewer logic: `docs/src/code/examples/router/viewers.tsx` (`SlideViewer`)
- Router keys: `docs/src/code/examples/router/createRouter.tsx`
- CSS animations and gating: `docs/src/code/examples/router/transitions.css`

