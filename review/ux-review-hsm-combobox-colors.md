# UX Review: HSM Combobox - Visualizer Polish & Color System

**Date:** 2025-12-27
**Focus:** Example chrome styling, visualizer UI, color consistency with Starlight theme
**Reviewed:** All HSM examples (combobox, traffic-light, checkout) - flattened & nested modes
**Scope:** Styling all example chrome and visualizers across the docs

---

## Theme Integration & Color System

### Starlight Theme Colors (Primary Reference)
- Primary accent: `--sl-color-accent` (seen in "Matchina" title)
- High contrast accent: `--sl-color-accent-high`
- These should be the foundation for all visualizer current-state highlighting

### Current Issues:
1. **Sketch green conflicts with theme** - Uses semantic "success" green instead of theme accent
2. **Mermaid attempts accent but poor execution** - Light purple washed out in dark mode, bland in light
3. **No unified color language** - Each visualizer feels like it came from different libraries (because they did)

---

## Critical UX Issues

### [P0] VISUALIZER CHROME: Too Verbose, Needs Simplification
**Current Structure (Too Much):**
```
State Machine Visualizer (Flattened)
  Sketch Systems Style | Mermaid Diagram
  💡 Click on transitions to trigger them when available

  Mermaid Diagram  Current state: Inactive
  Diagram Type: [State Chart ▼]
```

**Natural Expectation:**
- Single viz picker dropdown inside visualizer header
- OR clicking title does a popover
- Flatten and tighten the inspector UI

**Component:** Inspector chrome across all examples
**Impact:** Current UI feels improvised and pulled from different libs - needs cohesive redesign

---

### [P0] TITLE PLACEMENT: Wrong Position
**Current:** Title "State Machine Visualizer (Nested)" appears BELOW the example UI
**Should Be:** Title should be ABOVE the example UI

**Expected Flow:**
1. Flattened/Nested toggle
2. **State Machine Visualizer (Flattened)** ← Title here
3. Example UI (the combobox/traffic light/etc)
4. Visualizer inspector

**Component:** Example layout structure
**Impact:** Confusing hierarchy - visualizer title should introduce what follows, not appear after

---

### [P0] TAB WIDGET INCONSISTENCY
**Issue:** Two different tab styles in the same example:
1. **Machine type toggle:** Flattened / Nested (Hierarchical) - one style
2. **Visualizer type toggle:** Sketch Systems Style / Mermaid Diagram - different style

**Should Be:** Consistent tab/button styling across both toggle sets
**Component:** Tab components
**Impact:** Feels cobbled together from different component libraries

---

## Color & Contrast Issues

### [P1] MERMAID DARK MODE: Poor Contrast - Labels & Active Nodes Unreadable
**Current:** Multiple contrast failures:
- State box fills: Very light lavender/purple (#e6d5ff approx) - washed out on dark bg
- **Labels/text:** Poor contrast inside boxes - hard to read
- **Active nodes:** Light purple on dark background creates eye strain
- Transition labels barely visible

**Should Be:** Fix all contrast issues:
- Active node fills: Use `--sl-color-accent` with `--sl-color-text-invert` for text
- Inactive nodes: `--sl-color-gray-5` with proper text contrast
- All text must meet WCAG AA contrast ratios (4.5:1 minimum)
- See `MermaidInspector.css:31,60,63` - tries to use accent but execution fails

**Files:** `docs/src/components/inspectors/MermaidInspector.css`
**Impact:**
- Diagrams hard/painful to read in dark mode
- Accessibility failure (WCAG contrast)
- Unprofessional appearance

---

### [P1] MERMAID LIGHT MODE: Bland, Lifeless Colors
**Current:** Desaturated purple/lavender lacks vibrancy and visual energy

**Should Be:** Use theme accent colors properly:
- `--sl-color-accent` for current state
- `--sl-color-accent-high` for emphasis
- These already exist in theme but aren't used effectively

**Files:** `docs/src/components/inspectors/MermaidInspector.css`
**Impact:** Looks amateur, lacks polish expected from modern docs

---

### [P1] SKETCH GREEN: Conflicts with Theme + Wrong Semantics
**Current:**
- Green (#2d5016 approx) for current state
- Semantically wrong (green = success, not "current")
- Doesn't align with Starlight theme accent color

**Should Be:** Replace green with theme accent colors:
- Use `--sl-color-accent` for current state (aligns with Matchina title color)
- NOT gray (user explicitly said no gray)
- NOT green (conflicts with semantic meaning)

**Files:** `docs/src/components/inspectors/SketchInspector.css`
**Impact:**
- Color conflicts with theme identity
- Semantic confusion (green implies "success" not "you are here")
- Inconsistent with rest of docs

---

---

## Layout & Interaction Issues

### [P1] NESTED MERMAID: Diagram Stops Updating
**Issue:** Nested mode Mermaid diagram works initially, then stops updating after some interactions

**Status:** **BUG CONFIRMED** - works on first interaction but breaks after a bit
**Component:** `MermaidInspector.tsx` - likely state subscription issue with nested machines
**Action Needed:** Debug why diagram updates stop in nested mode after initial state changes

---

### [P2] SKETCH INSPECTOR LAYOUT JUMP
**Issue:** Sketch inspector layout jumps when typing in combobox - shouldn't happen

**Status:** Visual reflow observed during state transitions
**Component:** `docs/src/components/inspectors/SketchInspector.tsx` layout/styling
**Action Needed:** Investigate CSS that causes reflow when state changes

---

### [P2] SUGGESTION DROPDOWN BLUE: Keep This
**Current:** Autocomplete dropdown uses vibrant blue (#3b82f6 approx) - good contrast in both themes

**Note:** This blue IS good and should be reference for unified color system
- Already proven to work in both light/dark
- Could be basis for "active/current" state across all visualizers
- Semantically appropriate (blue = active/informational)

**Component:** Combobox suggestion styling
**Impact:** Demonstrates better color choices already exist in the UI

---

## Minor Polish Issues

### [P3] Tab Styling Consistency
**Screenshots:** All files show the tab pair "Sketch Systems Style" / "Mermaid Diagram"

**Current:** Simple button-style tabs with minimal visual distinction. Active state is just a color change.

**Should Be:** Unified styling - both toggles should use same component/style
**Files:** Example layout components
**Impact:** Small detail but contributes to "cobbled together" feeling

---

## Implementation Recommendations

### Phase 1: Color System (Use Starlight Theme)
**Replace all current-state highlighting with theme accent colors:**

1. **Sketch Inspector** - Replace green entirely:
   ```css
   /* Current state highlighting */
   background: var(--sl-color-accent);
   color: var(--sl-color-text-invert);
   border: 2px solid var(--sl-color-accent-high);
   ```

2. **Mermaid Inspector** - Fix existing accent usage:
   - Already tries to use `--sl-color-accent-high` but execution is poor
   - Need better contrast ratios and proper text colors
   - Dark mode needs darker fills, light mode needs saturation

3. **Unified Palette:**
   - Current state: `--sl-color-accent` (matches Matchina title)
   - Current state emphasis: `--sl-color-accent-high`
   - Inactive: `--sl-color-gray-4` / `--sl-color-gray-2`
   - Borders: `--sl-color-gray-5` / `--sl-color-gray-3`

### Phase 2: Chrome Simplification
**Flatten and simplify inspector UI:**

1. **Combine controls into single header:**
   ```
   State Machine Visualizer (Flattened)  [Visualizer: Mermaid ▼] [Chart Type: State ▼]
   💡 Tip: Click transitions to trigger them
   Current state: Inactive
   [Diagram appears here]
   ```

2. **OR use popover approach:**
   - Click title to show viz picker
   - Reduces visual clutter
   - More native feel

### Phase 3: Layout & Structure
1. Move visualizer title ABOVE example UI
2. Unify tab/toggle styling across both sets
3. Fix sketch inspector layout jump

### Phase 4: Bug Fixes
1. Fix nested Mermaid diagram update issue (state subscription)
2. Fix sketch inspector reflow on state change

---

## Files Requiring Changes

**CSS:**
- `docs/src/components/inspectors/MermaidInspector.css` - accent color usage
- `docs/src/components/inspectors/SketchInspector.css` - replace green with accent

**Components:**
- `docs/src/components/inspectors/MermaidInspector.tsx` - nested update bug
- `docs/src/components/inspectors/SketchInspector.tsx` - layout jump
- Example layout wrapper (find component that orders: toggle, UI, visualizer)

**Global:**
- Tab/toggle component styling for consistency

---

## Testing Checklist
After implementing changes, verify across ALL examples:
- [ ] HSM Combobox (flattened + nested)
- [ ] HSM Traffic Light (flattened + nested)
- [ ] HSM Checkout (if uses visualizers)
- [ ] Light theme - all colors visible and on-brand
- [ ] Dark theme - proper contrast, no washed-out colors
- [ ] Nested mode Mermaid updates consistently
- [ ] No layout jumps when interacting with examples
- [ ] Tab styling consistent between toggles
