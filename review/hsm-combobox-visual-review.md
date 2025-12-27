# HSM Combobox Visual Review

**Date:** 2024-12-26  
**Scope:** Mode tabs, combobox widget, visualizer tabs, sketch/mermaid visualizers  
**Themes:** Light and Dark mode  
**Test:** `test/e2e/hsm-combobox-visual-review.spec.ts`

---

## Summary

The HSM Combobox example has functional issues (Mermaid syntax error) and styling inconsistencies from mixing Starlight theme with hardcoded Tailwind colors. The sketch visualizer works well but needs theme-aware styling.

### Critical Issues

| Issue | Severity | Category |
|-------|----------|----------|
| Mermaid visualizer fails with syntax error | 🔴 High | Functional |
| Inactive visualizer tabs are white in dark mode | 🟡 Medium | Theme |
| Hardcoded colors don't respect Starlight tokens | 🟡 Medium | Theme |
| Low contrast on input borders (both modes) | 🟡 Medium | Accessibility |

---

## Screenshots Matrix

### Light Mode

| Flat + Sketch | Flat + Mermaid |
|---------------|----------------|
| ![](screenshots/hsm-combobox/light-flat-sketch.png) | ![](screenshots/hsm-combobox/light-flat-mermaid.png) |

| Nested + Sketch | Nested + Mermaid |
|-----------------|------------------|
| ![](screenshots/hsm-combobox/light-nested-sketch.png) | ![](screenshots/hsm-combobox/light-nested-mermaid.png) |

### Dark Mode

| Flat + Sketch | Flat + Mermaid |
|---------------|----------------|
| ![](screenshots/hsm-combobox/dark-flat-sketch.png) | ![](screenshots/hsm-combobox/dark-flat-mermaid.png) |

| Nested + Sketch | Nested + Mermaid |
|-----------------|------------------|
| ![](screenshots/hsm-combobox/dark-nested-sketch.png) | ![](screenshots/hsm-combobox/dark-nested-mermaid.png) |

---

## Detailed Findings

### 1. Mermaid Visualizer - BROKEN

**Status:** Non-functional in all configurations

![Mermaid Error](screenshots/hsm-combobox/light-flat-mermaid.png)

The Mermaid visualizer shows "Loading..." and throws:
```
Syntax error in text mermaid version 11.12.2
```

**Root cause:** The generated Mermaid diagram definition has syntax incompatible with current Mermaid version.

---

### 2. Mode Toggle Tabs (Flattened/Nested)

![Light Flat](screenshots/hsm-combobox/light-flat-sketch.png)

**Issues:**
- Center-aligned while content is left-aligned (visual rhythm break)
- Uses hardcoded `bg-gray-100 dark:bg-gray-800` instead of Starlight tokens
- Active state blue (`text-blue-600`) doesn't match Starlight accent

**Fix:** Use Starlight's `--sl-color-*` CSS variables.

---

### 3. Visualizer Tabs (Sketch/Mermaid)

**Light mode:** Works reasonably well
**Dark mode:** Major issue

![Dark Mode Tab Issue](screenshots/hsm-combobox/dark-flat-sketch.png)

The inactive "Mermaid Diagram" button stays **white with black text** in dark mode - creates jarring "glare" effect.

**Code culprit:** Hardcoded in `HSMVisualizerDemo.tsx`:
```tsx
'bg-gray-100 text-gray-700 hover:bg-gray-200'  // No dark: variants
```

---

### 4. Sketch Visualizer

#### Light Mode
![Light Sketch Detail](screenshots/hsm-combobox/light-flat-sketch-visualizer-only.png)

- ✅ Clear state hierarchy
- ✅ Active state highlighting (blue/purple)
- ⚠️ Transition labels crowded near boundaries
- ⚠️ Blue active state is more saturated than Starlight accent

#### Dark Mode  
![Dark Sketch Detail](screenshots/hsm-combobox/dark-flat-sketch-visualizer-only.png)

- ✅ Active state visible with blue highlight
- ⚠️ Nested state boxes use **white backgrounds** - doesn't adapt to dark mode
- ⚠️ State container boundaries hard to distinguish (dark-on-dark)

---

### 5. Combobox Widget

**Both modes:**
- Input border too faint (potential WCAG contrast issue)
- "State: Inactive" label lacks visual connection to input

**Dark mode specific:**
- Input background nearly identical to page background
- Placeholder text dim but readable

---

### 6. Nested vs Flat Comparison

![Nested Light](screenshots/hsm-combobox/light-nested-sketch.png)

**Documentation mismatch:** The "State Structure" section mentions a `Selecting` state, but neither the code nor visualizer shows it. States shown are:
- Empty
- TextEntry  
- Suggesting

---

## Recommendations

### Quick Wins
1. **Fix Mermaid syntax** - Debug the diagram generation
2. **Add dark variants to visualizer tabs:**
   ```tsx
   'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
   ```
3. **Increase input border contrast**

### Theme Alignment (Longer term)
Replace hardcoded Tailwind colors with Starlight CSS variables:

```css
/* Instead of */
bg-blue-600 text-white

/* Use */
background: var(--sl-color-accent);
color: var(--sl-color-accent-high);
```

Key Starlight tokens:
- `--sl-color-accent` / `--sl-color-accent-high`
- `--sl-color-bg` / `--sl-color-bg-nav`
- `--sl-color-text` / `--sl-color-text-accent`
- `--sl-color-gray-*` (1-6 scale)

---

## Test Automation

The Playwright test can be re-run anytime:

```bash
npx playwright test test/e2e/hsm-combobox-visual-review.spec.ts
```

Screenshots are saved to `review/screenshots/hsm-combobox/`.

### Test Coverage
- ✅ Light/Dark mode toggle
- ✅ Flattened/Nested machine modes
- ✅ Sketch/Mermaid visualizer tabs
- ✅ Full page + visualizer-only screenshots
- ✅ Interaction states (focus, typing)
