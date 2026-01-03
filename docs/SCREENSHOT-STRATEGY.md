# Screenshot Strategy & Visual Comparison

## 🎯 What You Do Today

### **Current Workflow:**
```bash
# Find screenshots
npm run screenshots

# Open specific screenshot  
npm run screenshots open <name>

# Generate HTML report (manual only)
npm run screenshots:html
open playwright-report/index.html

# Browse directories directly
open test/e2e/visual/*-snapshots/
open test-results/
open review/screenshots/
```

### **What Works:**
- ✅ **Screenshot viewer** finds all images across 5 locations
- ✅ **Playwright HTML reports** show test context and diffs
- ✅ **Focused screenshots** (interactive area only)
- ✅ **Coverage tracking** (5/27 examples tested)

### **What's Annoying:**
- ❌ **Manual comparison** - opening multiple Preview windows
- ❌ **No side-by-side view** - can't see before/after easily
- ❌ **Scattered locations** - images in 5 different directories

## 🔧 Today's Solutions

### **Option 1: Playwright HTML Reports**
```bash
npm run screenshots:html
open playwright-report/index.html
```
**What you get:**
- Test steps with screenshots
- Before/after comparisons with red diff highlighting
- Interactive timeline

### **Option 2: Manual Side-by-Side**
```bash
# Open baseline
open test/e2e/visual/all-visualizers-complete.spec.ts-snapshots/mermaid-light-flat-1-inactive.png

# Open actual (if test failed)
open test-results/functional-checkout-smoke--*/checkout-light-initial-actual.png
```

### **Option 3: Screenshot Viewer**
```bash
npm run screenshots                    # See all 195 screenshots
npm run screenshots open mermaid        # Open specific one
```

## 🎯 **Screenshot Framing - What We Capture**

### **✅ **What We Include (Interactive Example Area):**
- **Visualizer area** - The actual diagram/graph visualization
- **App controls** - Interactive buttons, inputs, form elements
- **Visualizer tabs** - Sketch/Mermaid/ReactFlow selector (when present)
- **Mode buttons** - Flattened vs Nested (when present)

### **❌ **What We Exclude (Documentation Chrome):**
- **Documentation header** - Navigation, title, breadcrumbs
- **Sidebar** - Table of contents
- **Code tabs** - Source code display
- **Footer** - Documentation footer
- **Page chrome** - Non-interactive page elements

### **🎯 **DOM Structure:**
```
.space-y-4 (page container)
├── .machine-visualizer (main component wrapper)
│   ├── [visualizer-controls] (tabs, mode buttons) - WHEN PRESENT
│   └── .machine-visualizer > div:last-child (INTERACTIVE AREA)
│       ├── .viz-container (THIRD-PARTY VISUALIZER)
│       └── .app-container (EXAMPLE APP CONTROLS)
```

### **📸 **Example: HSM Combobox**
- **Tabs:** Sketch, Mermaid, ReactFlow (visualizer selector)
- **Visualization:** State machine diagram in selected visualizer
- **App:** Combobox input with suggestions
- **Controls:** Mode buttons (Flattened/Nested)

### **🎯 **Why This Framing:**
- **Focused testing** - Only test what matters (interactive functionality)
- **Consistent sizing** - Same dimensions across all examples
- **No distractions** - Documentation chrome excluded
- **Fast comparisons** - Smaller files, quicker diffs

## 📋 Screenshot Locations

| Location | Purpose | Count |
|----------|---------|--------|
| `test/e2e/*-snapshots/` | Test baselines | 36 |
| `test-results/` | Test failures | 0 |
| `review/screenshots/` | Manual development | 130 |
| `.playwright-mcp/` | MCP tool output | 29 |

## 🎯 Quick Commands

```bash
# See what exists
npm run screenshots

# Open HTML report for test context
npm run screenshots:html

# Find specific image
npm run screenshots open <partial-name>

# Browse all screenshots
open test/e2e/visual/all-visualizers-complete.spec.ts-snapshots/
```

That's it. This is what works today.
