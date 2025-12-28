# Mermaid Theming: Lessons Learned

**Date:** 2025-12-27
**Context:** Styling Mermaid state diagrams and flowcharts for light/dark theme consistency

---

## Summary

This document captures hard-won knowledge about theming Mermaid diagrams in a dual-theme (light/dark) environment. The goal was to make flowcharts and state charts look consistent across both themes.

---

## The Problem

Mermaid diagrams have two rendering modes in our app:
1. **State Diagram v2** (`stateDiagram-v2`) - Hierarchical state machines
2. **Flowchart** (`graph LR`) - Graph-based visualization

**Initial state:** State charts looked good, flowcharts had terrible contrast issues and didn't match.

---

## Key Architecture Decisions

### 1. CSS Injection via `themeCSS`

**What works:**
```javascript
mermaid.initialize({
  themeVariables: { /* ... */ },
  themeCSS: mermaidInspectorCss,  // Inject our CSS directly
});
```

**Why:** Mermaid's built-in theming system is limited. Injecting raw CSS via `themeCSS` gives full control over styling without fighting Mermaid's theme engine.

**Critical:** The CSS must be imported as raw text (`import css from './file.css?raw'`)

### 2. Theme Variables vs Direct Styling

**What DOESN'T work well:**
```javascript
themeVariables: {
  primaryColor: 'transparent',
  primaryBorderColor: '#a78bfa',
  // ... many more variables
}
```

**Problems:**
- Variables map differently for flowchart vs stateDiagram
- Incomplete coverage - some elements ignore variables
- Hard to predict which variable affects what
- Theme switching requires re-initialization

**What WORKS:**
```css
/* Direct CSS targeting with CSS variables */
.node rect {
  fill: transparent !important;
  stroke: var(--sl-color-accent-high) !important;
}
```

**Why:**
- CSS variables from your theme system (Starlight) adapt automatically
- `!important` overrides Mermaid's inline styles
- Works for both diagram types
- No re-initialization needed for theme switches

---

## Critical Selectors

### State Diagrams (stateDiagram-v2)

**Default states:**
```css
.state-diagram-v2 g.state-node path,
g[class*="state"] path:not([class*="active"]) {
  fill: transparent !important;
  stroke: var(--sl-color-accent-high) !important;
  stroke-width: 2px !important;
}
```

**Active/highlighted states:**
```css
.state-diagram-v2 g.state-node.state-highlight path,
g[class*="state"].state-highlight path:not([class*="active"]) {
  fill: var(--sl-color-accent-high) !important;
  stroke: var(--sl-color-accent-high) !important;
}
```

**State text:**
```css
.state text,
.state-diagram-v2 text,
g[class*="state"] text {
  fill: var(--sl-color-text) !important;
  color: var(--sl-color-text) !important;
}
```

**Active state text (inverted):**
```css
.state-highlight span.nodeLabel,
.state-highlight span.nodeLabel p {
  color: var(--sl-color-bg) !important;
  fill: var(--sl-color-bg) !important;
}
```

### Flowcharts (graph LR/TD)

**Node rectangles:**
```css
.node rect {
  fill: transparent !important;
  stroke: var(--sl-color-accent-high) !important;
  stroke-width: 2px !important;
  rx: 5;  /* Border radius */
  ry: 5;
}
```

**Node text:**
```css
.node text,
.node p {
  fill: var(--sl-color-text) !important;
  color: var(--sl-color-text) !important;
}
```

**Active nodes:**
```css
.node.active path {
  fill: var(--sl-color-accent-high) !important;
  stroke: var(--sl-color-accent-high) !important;
}

.node.active text,
.node.active p {
  fill: var(--sl-color-bg) !important;  /* Inverted for contrast */
  color: var(--sl-color-bg) !important;
}
```

### Edge Labels (Both types)

**Edge label text:**
```css
.edgeLabel text {
  fill: var(--sl-color-text) !important;
}
```

**Edge label backgrounds:**
```css
.edgeLabel rect {
  fill: var(--sl-color-gray-2) !important;
  stroke: var(--sl-color-gray-4) !important;
}

html[data-theme="dark"] .edgeLabel rect {
  fill: var(--sl-color-gray-1) !important;
  stroke: var(--sl-color-gray-5) !important;
}
```

**Why different:** Edge labels need contrast against both the diagram background AND the connecting lines.

---

## Mistakes & Lessons

### ❌ MISTAKE 1: Theme-Specific Overrides

**What I did wrong:**
```css
/* Light mode */
.node rect {
  fill: var(--sl-color-gray-2) !important;
  stroke: var(--sl-color-gray-5) !important;
}

/* Dark mode override */
html[data-theme="dark"] .node rect {
  fill: transparent !important;
  stroke: var(--sl-color-accent-high) !important;
}
```

**Problems:**
- Created inconsistency between themes
- `--sl-color-gray-2` was DARK in light mode (naming confusion)
- Required maintaining two rulesets
- Easy to forget one theme

**✅ Fix:**
```css
/* Works in BOTH themes */
.node rect {
  fill: transparent !important;
  stroke: var(--sl-color-accent-high) !important;
}
```

**Lesson:** Use CSS variables that adapt to themes, not theme-specific rules.

### ❌ MISTAKE 2: Forgetting !important

**What happened:**
```css
.node rect {
  fill: transparent;  /* Mermaid inline styles override this */
}
```

**Why it failed:** Mermaid adds inline `style` attributes that override regular CSS.

**✅ Fix:**
```css
.node rect {
  fill: transparent !important;  /* Overrides inline styles */
}
```

**Lesson:** Always use `!important` when styling Mermaid elements, or they won't apply.

### ❌ MISTAKE 3: Assuming Selectors Work the Same

**What I assumed:** `.node` works for both flowcharts and state diagrams.

**Reality:**
- Flowcharts use `.node rect`
- State diagrams use `g.state-node path`
- Edge styling differs: `.edgeLabel` vs `.transition`

**✅ Fix:** Test both diagram types, use type-specific selectors when needed.

### ❌ MISTAKE 4: Text Styling Complexity

**What I missed:** Text can be in multiple elements:
```html
<text>Direct text</text>
<text><tspan>Wrapped text</tspan></text>
<foreignObject><p>HTML text</p></foreignObject>
```

**✅ Solution:** Target all possibilities:
```css
.node text,
.node p,
.node tspan {
  fill: var(--sl-color-text) !important;
  color: var(--sl-color-text) !important;
}
```

**Lesson:** Use both `fill` (SVG) and `color` (HTML) for comprehensive coverage.

### ❌ MISTAKE 5: Start State Circles

**Problem:** Start state circles (filled black dots) were invisible in dark mode.

**What didn't work:**
```css
circle {  /* Too broad, affects other circles */
  fill: white !important;
}
```

**✅ Fix:**
```css
.node circle.state-start {
  fill: var(--sl-color-text);
  stroke: var(--sl-color-text);
}
```

**Lesson:** Be specific with selectors. Mermaid uses circles for multiple purposes.

---

## What Works Best

### 1. Transparent Node Backgrounds

**Pattern:**
```css
/* Both flowchart and state nodes */
.node rect,
.state-diagram-v2 g.state-node path {
  fill: transparent !important;
}
```

**Why:**
- Works on any background color
- Looks clean and modern
- No theme-specific styling needed
- Reduces visual clutter

### 2. Consistent Border Treatment

**Pattern:**
```css
stroke: var(--sl-color-accent-high) !important;
stroke-width: 2px !important;
```

**Why:**
- Accent color provides visual hierarchy
- 2px is visible but not overwhelming
- Same thickness = visual consistency

### 3. Active State Highlighting

**Pattern:**
```css
/* Fill active nodes */
.state-highlight path,
.node.active path {
  fill: var(--sl-color-accent-high) !important;
}

/* Invert text for contrast */
.state-highlight text,
.node.active text {
  fill: var(--sl-color-bg) !important;
}
```

**Why:**
- Clear visual feedback
- Inverted text maintains readability
- Users instantly see current state

### 4. Edge Label Backgrounds

**Pattern:**
```css
.edgeLabel rect {
  fill: var(--sl-color-gray-2) !important;
  stroke: var(--sl-color-gray-4) !important;
}
```

**Why:**
- Prevents label text from blending with edges
- Subtle background doesn't distract
- Border creates clear separation

---

## Testing Strategy

### 1. Automated Visual Regression

**Use Playwright:**
```typescript
test('flowchart matches statechart styling', async ({ page }) => {
  for (const theme of ['light', 'dark']) {
    await setTheme(page, theme);

    for (const type of ['statechart', 'flowchart']) {
      await selectDiagramType(page, type);
      await page.locator('#mermaid-1').screenshot({
        path: `review/screenshots/${type}-${theme}.png`
      });
    }
  }
});
```

**Why:**
- Catches regressions immediately
- Documents expected appearance
- Easy to compare before/after changes

### 2. Manual Checklist

For each change, verify:
- [ ] Light mode: state chart
- [ ] Light mode: flowchart
- [ ] Dark mode: state chart
- [ ] Dark mode: flowchart
- [ ] Active state highlighting
- [ ] Edge label visibility
- [ ] Text contrast (WCAG AA minimum)
- [ ] Start state visibility

### 3. Real Examples

**Don't just test simple diagrams.** Use complex real-world examples:
- hsm-combobox (nested states, many transitions)
- hsm-checkout (hierarchical with submachines)
- traffic-light (auto-transitions, timing)

Complex diagrams expose edge cases simple ones hide.

---

## CSS Variable Dependencies

### Starlight Theme Variables Used

```css
--sl-color-text          /* Main text color */
--sl-color-bg            /* Background color */
--sl-color-accent-high   /* Primary accent (purple) */
--sl-color-gray-1        /* Lightest gray */
--sl-color-gray-2        /* Light gray */
--sl-color-gray-4        /* Medium gray */
--sl-color-gray-5        /* Dark gray */
--sl-color-gray-6        /* Darkest gray */
```

**Critical:** These variables auto-adapt when theme switches. Use them instead of hardcoded colors.

### Variable Naming Gotcha

**WATCH OUT:** `--sl-color-gray-2` is DARKER in light mode than you'd expect!

**Gray scale in light mode:**
- gray-1: lightest (nearly white)
- gray-2: **dark gray** ⚠️
- gray-6: darkest (nearly black)

**Gray scale in dark mode:**
- gray-1: darkest
- gray-6: lightest

**Lesson:** Test your assumptions. Preview actual color values.

---

## Performance Considerations

### 1. CSS Injection Timing

```javascript
import mermaidInspectorCss from './MermaidInspector.css?raw';

mermaid.initialize({
  themeCSS: mermaidInspectorCss,  // Injected once at init
});
```

**Why:** Injecting CSS once is faster than applying styles per diagram.

### 2. Avoid Re-initialization

**Bad:**
```javascript
// DON'T do this on theme change
mermaid.initialize({ theme: 'dark' });
```

**Good:**
```javascript
// Just toggle the data-theme attribute
document.documentElement.setAttribute('data-theme', 'dark');
// CSS variables handle the rest
```

**Why:** Re-initialization is slow and causes flicker.

### 3. Debounce Highlighting Updates

```typescript
const debouncedStateKey = useDebouncedValue(stateKey, 60);
```

**Why:** State machines can transition rapidly. Debouncing prevents excessive DOM updates.

---

## Common Patterns

### Pattern: Interactive Edge Labels

```css
/* Default edge labels */
.edgeLabel p {
  cursor: default;
  opacity: 0.7;
}

/* Clickable edges from current state */
.edge-active.edge-interactive {
  cursor: pointer !important;
  text-decoration: underline !important;
  font-weight: 600 !important;
}

.edge-active.edge-interactive:hover {
  background-color: var(--sl-color-accent-high) !important;
  color: var(--sl-color-text-invert) !important;
}
```

**Usage:** Applied via JavaScript based on current state:
```typescript
if (isCurrentStateAction && canInvoke) {
  p.classList.add('edge-active', 'edge-interactive');
  p.onclick = () => action();
}
```

### Pattern: Nested State Highlighting

```css
/* Highlight active leaf state */
.state-highlight path {
  fill: var(--sl-color-accent-high) !important;
}

/* Subtle highlight for parent container */
.state-container-highlight rect {
  stroke: var(--sl-color-accent-high) !important;
  stroke-width: 2px !important;
  fill: var(--sl-color-accent-high) !important;
  fill-opacity: 0.15 !important;
}
```

**Why:** Shows both the active state AND its parent context.

---

## Debugging Tips

### 1. Inspect Generated SVG

**Do this:**
```javascript
// In browser console after diagram renders
console.log(document.querySelector('#mermaid-1').innerHTML);
```

**Look for:**
- What classes are actually applied?
- What inline styles exist?
- What's the DOM structure?

**Lesson:** Mermaid's output varies by version. Don't assume structure.

### 2. Check CSS Specificity

**Problem:** Your rules don't apply.

**Debug:**
```css
/* Add this temporarily to see if selector works */
.node rect {
  border: 5px solid red !important;  /* Obvious if it works */
}
```

**If it works:** Specificity issue or missing `!important`
**If it doesn't work:** Wrong selector

### 3. Theme Variable Preview

```javascript
// Check what colors you're actually using
const styles = getComputedStyle(document.documentElement);
console.log('accent-high:', styles.getPropertyValue('--sl-color-accent-high'));
console.log('text:', styles.getPropertyValue('--sl-color-text'));
```

### 4. Screenshot Diff

**Use Playwright to compare:**
```bash
npx playwright test --update-snapshots  # Capture new baseline
npx playwright test                      # Compare against baseline
```

**Why:** Visual regressions are hard to catch manually.

---

## Future Improvements

### 1. Mermaid CSS Variables

**Idea:** Define Mermaid-specific CSS variables:
```css
:root {
  --mermaid-node-bg: transparent;
  --mermaid-node-border: var(--sl-color-accent-high);
  --mermaid-node-text: var(--sl-color-text);
  --mermaid-stroke-width: 2px;
}
```

**Benefits:**
- Single source of truth
- Easy to tweak without searching CSS
- Can expose as theming API

### 2. Diagram Type Detection

**Current:** Manual diagram type selection via dropdown

**Better:** Auto-detect appropriate diagram type based on machine structure:
- Flat machines → Flowchart
- Hierarchical machines → State diagram
- Promise machines → Sequence diagram (future)

### 3. Consistent Class Naming

**Add to React components:**
```typescript
<div className="mermaid-container" data-diagram-type="flowchart">
  <div id="mermaid-1" className="mermaid-diagram">
```

**Benefits:**
- More specific CSS selectors
- Easier type-specific styling
- Better debugging

---

## Key Takeaways

1. **Use CSS variables that adapt**, not theme-specific overrides
2. **Always use `!important`** to override Mermaid's inline styles
3. **Test both diagram types** (flowchart AND state chart)
4. **Test both themes** (light AND dark)
5. **Transparent backgrounds work best** for universal theming
6. **Inject CSS via `themeCSS`**, don't fight `themeVariables`
7. **Use Playwright for visual regression** testing
8. **Target multiple text elements** (`text`, `p`, `tspan`)
9. **Be specific with selectors** (`.state-start` not just `circle`)
10. **Document with screenshots** - a picture = 1000 lines of CSS

---

## Resources

- **Mermaid Docs:** https://mermaid.js.org/config/theming.html
- **Starlight Theme Vars:** Check `node_modules/@astrojs/starlight/style/props.css`
- **This Project's Tests:** `test/e2e/mermaid-diagram-type-comparison.spec.ts`
- **Visual Review:** `review/mermaid-diagram-type-styling-review.md`

---

*Last updated: 2025-12-27*
