# Mermaid Diagram Type Styling Review

**Date:** 2025-12-27
**Branch:** `feat/hsm-dual-mode-with-viz-and-examples`
**Test:** `test/e2e/mermaid-diagram-type-comparison.spec.ts`

---

## Summary

Fixed flowchart styling to match state chart styling across light and dark themes. Flowcharts now use transparent node backgrounds with accent borders, consistent with state chart appearance.

### Fixed Issues

| Issue | Status | Impact |
|-------|--------|--------|
| Flowchart light mode: dark fills with poor text contrast | ✅ Fixed | High - Readability |
| Flowchart dark mode: gray fills don't match state chart | ✅ Fixed | Medium - Consistency |
| Inconsistent styling between diagram types | ✅ Fixed | High - UX |

---

## Changes Made

### MermaidInspector.css

**Before:**
```css
/* Flowchart node styling */
.node rect {
  fill: var(--sl-color-gray-2) !important;  /* Dark gray in light mode! */
  stroke: var(--sl-color-gray-5) !important;
  rx: 10;
  ry: 10;
}

/* Dark mode: transparent flowchart nodes */
html[data-theme="dark"] .node rect {
  fill: transparent !important;
  stroke: var(--sl-color-accent-high) !important;
}
```

**After:**
```css
/* Flowchart node styling - match state chart style */
.node rect {
  fill: transparent !important;
  stroke: var(--sl-color-accent-high) !important;
  stroke-width: 2px !important;
  rx: 5;
  ry: 5;
}

/* Flowchart text styling */
.node text,
.node p {
  fill: var(--sl-color-text) !important;
  color: var(--sl-color-text) !important;
}
```

---

## Screenshot Coverage

### Before Fix

**Light Mode Flowchart:**
- Dark gray node fills
- Dark gray text on dark gray background
- **Critical readability issue**

**Dark Mode Flowchart:**
- Light gray fills
- Didn't match state chart transparent style

### After Fix

**Both Themes:**
- Transparent node backgrounds
- Accent-colored borders (purple)
- Consistent with state chart styling
- Excellent text contrast

### Files Generated
```
statechart-light.png   # State chart in light mode
statechart-dark.png    # State chart in dark mode
flowchart-light.png    # Flowchart in light mode (FIXED)
flowchart-dark.png     # Flowchart in dark mode (FIXED)
```

---

## Styling Consistency

### ✅ State Chart
- Light mode: Transparent backgrounds with accent borders
- Dark mode: Transparent backgrounds with accent borders
- **Consistent across themes**

### ✅ Flowchart (After Fix)
- Light mode: Transparent backgrounds with accent borders
- Dark mode: Transparent backgrounds with accent borders
- **Now matches state chart!**

### Key Improvements
1. **Removed theme-specific overrides** - One rule works for both themes
2. **Matched border styling** - 2px stroke width like state charts
3. **Ensured text contrast** - Explicit text color rules
4. **Reduced corner radius** - From rx:10 to rx:5 for subtler appearance

---

## Running Tests

```bash
# Run comparison test
npx playwright test test/e2e/mermaid-diagram-type-comparison.spec.ts

# Capture all 4 combinations
npx playwright test test/e2e/mermaid-diagram-type-comparison.spec.ts:81

# View results
open review/screenshots/mermaid-comparison/
```

Screenshots saved to `review/screenshots/mermaid-comparison/`.

---

## Next Steps

- ✅ Flowchart and state chart styling now consistent
- ✅ Both themes properly supported
- ✅ Text readability improved
- Consider: Review other mermaid diagram types (sequence, class, etc.) for consistency
