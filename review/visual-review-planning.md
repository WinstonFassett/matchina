# Visual Review Planning

**Date:** 2024-12-26  
**Source:** Playwright visual review of HSM Combobox example

---

## Existing Beads Issues (Ready)

| ID | Title | Overlaps with Visual Review? |
|----|-------|------------------------------|
| matchina-zc0 | hsm checkout ui buttons don't work | ❌ No - different example |
| matchina-d38 | Examples are buried by AI Slop | ❌ No - docs content issue |
| matchina-ei5 | nested combobox stopped working | ✅ Yes - explains why nested mode may have issues |
| matchina-04c | flattened hsm combobox example UI goes dead | ✅ Yes - UI functional bug |

---

## Visual Review Findings → Issue Mapping

### Functional Bugs (High Priority)

| Finding | Existing Issue? | Action |
|---------|-----------------|--------|
| Mermaid visualizer broken (Loading...) | ❌ None | Create new issue |
| Nested combobox typing error | ✅ matchina-ei5 | Keep as-is |
| Flattened combobox goes dead | ✅ matchina-04c | Keep as-is |

### Styling Issues (Medium Priority)

| Finding | Existing Issue? | Action |
|---------|-----------------|--------|
| Visualizer tabs: inactive white in dark mode | ❌ None | Create new issue |
| Sketch nested states: white backgrounds in dark mode | ❌ None | Bundle with above |
| Widget input borders low contrast | ❌ None | Create new issue |
| Dropdown z-index overlaps heading | ❌ None | Bundle with widget styling |

### Improvement Opportunities

| Finding | Existing Issue? | Action |
|---------|-----------------|--------|
| Hardcoded Tailwind vs Starlight tokens | ❌ None | Create epic for theme alignment |

---

## Proposed New Issues

### 1. Mermaid Visualizer Broken
**Type:** bug  
**Priority:** 1  
**Description:** Mermaid diagram tab shows "Loading..." and never renders. Likely syntax error in generated diagram definition.

### 2. Dark Mode Styling for Visualizers
**Type:** bug  
**Priority:** 2  
**Description:** Multiple dark mode issues in HSMVisualizerDemo:
- Inactive visualizer tab stays white (missing dark: variants)
- Nested state boxes use white backgrounds
- Transition button text low contrast in active state

### 3. Widget Styling Polish
**Type:** chore  
**Priority:** 2  
**Description:** Combobox widget needs styling improvements:
- Input border contrast too low in both modes
- Suggestions dropdown z-index overlaps visualizer heading
- State label visually disconnected from input

### 4. (Epic) Starlight Theme Alignment
**Type:** epic  
**Priority:** 3  
**Description:** Replace hardcoded Tailwind colors with Starlight CSS variables for consistent theming across all example components.

---

## Recommendation

**Keep:** matchina-ei5, matchina-04c, matchina-zc0, matchina-d38 (all valid)

**Create:**
1. Mermaid broken (high priority blocker)
2. Dark mode visualizer styling (medium)

**Defer:**
- Widget polish and theme alignment as lower priority after functional bugs fixed

---

## Test Automation Asset

Created reusable Playwright test: `test/e2e/hsm-combobox-visual-review.spec.ts`

Can re-run after fixes to verify:
```bash
npx playwright test test/e2e/hsm-combobox-visual-review.spec.ts
```
