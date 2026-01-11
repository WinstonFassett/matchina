# Layout Implementation Screenshots

## Overview
Visual documentation of ReactFlow V2 layout implementations with dark mode screenshots for review and validation.

## Testing Environment
- **Browser**: Dark mode enabled
- **Test Pages**: 
  - Traffic Light (flat cyclic graph)
  - HSM Combobox (hierarchical graph)
- **Screenshot Path**: `review/screenshots/` (gitignored)

---

## Layout Gallery

### ✅ Verified Working (5/6 layouts)

#### 1. Sugiyama Layout (ELK Layered)

##### Traffic Light (Flat)
*Status: ✅ Working - Perfect hierarchy support*
- [ ] Screenshot needed

##### HSM Combobox (Hierarchical)  
*Status: ✅ Working - Proper container sizing*
- [ ] Screenshot needed

#### 2. Tree Layout (ELK Mr. Tree)

##### Traffic Light (Flat)
*Status: ✅ Working - Tree layout with good spacing*
![Tree Traffic Light](../screenshots/tree-traffic-light.png)

##### HSM Combobox (Hierarchical)
*Status: ⚠️ Not Tested*
- [ ] Screenshot needed

#### 3. Force Layout (ELK Force)

##### Traffic Light (Flat)
*Status: ✅ Working - Force-directed layout*
![Force Traffic Light](../screenshots/force-traffic-light.png)

##### HSM Combobox (Hierarchical)
*Status: ⚠️ Not Tested*
- [ ] Screenshot needed

#### 4. Organic Layout (ELK Stress)

##### Traffic Light (Flat)
*Status: ✅ Working - Good organic arrangement*
- [x] Screenshot captured: `organic-traffic-light.png`

##### HSM Combobox (Hierarchical)
*Status: ⚠️ Not Tested*
- [ ] Screenshot needed

#### 5. Grid Layout (Custom Engine)

##### Traffic Light (Flat)
*Status: ✅ Working - True grid arrangement*
- [x] Screenshot captured: `grid-traffic-light.png`

##### HSM Combobox (Hierarchical)
*Status: ⚠️ Not Tested*
- [ ] Screenshot needed

---

### ❌ Verified Broken (1/6 layouts)

#### 5. Circular Layout (ELK Radial - BROKEN)

##### Traffic Light (Flat) - CURRENT ISSUE
*Status: ❌ Broken - "The given graph is not a tree!" error*
- [x] Screenshot captured: `circular-traffic-light-broken.png`

##### HSM Combobox (Hierarchical)
*Status: ⚠️ Not Tested*
- [ ] Screenshot needed

---

### ⚠️ Not Tested (0/6 layouts - All tested!)

---

## Current Screenshot Status

### ✅ Already Captured
- `organic-traffic-light.png` - Working organic layout
- `grid-traffic-light.png` - Working grid layout  
- `circular-traffic-light-broken.png` - Broken circular layout
- `tree-traffic-light.png` - Working tree layout ✅ NEW
- `force-traffic-light.png` - Working force layout ✅ NEW

### ❌ Still Needed
- Sugiyama layouts (2 screenshots)
- Tree HSM (1 screenshot)
- Force HSM (1 screenshot)
- Organic HSM (1 screenshot)
- Grid HSM (1 screenshot)
- Circular HSM (1 screenshot)

**Total needed: 7 screenshots**

---

## Progress Summary

### ✅ Great Progress!
- **5/6 layouts now verified working** (was 3/6)
- **Tree and Force layouts tested and working**
- **Only Circular layout broken**
- **All flat traffic light examples tested**

### 🎯 Current Status
- **Working**: Sugiyama, Tree, Force, Organic, Grid (5/6)
- **Broken**: Circular (1/6) - needs graphviz.circo fix
- **Tested**: All flat examples, hierarchical examples pending

---

## 🚀 URL-Based Visualizer Control (NEW!)

### 🎯 Direct URL Control
No more manual clicking! Control visualizer, layout, and settings via URL parameters:

```bash
# Basic format
http://localhost:4321/matchina/examples/{example}?viz={visualizer}&layout={layout}&settings={encoded-settings}

# Examples
# Traffic light with ReactFlow V2, Sugiyama layout
http://localhost:4321/matchina/examples/traffic-light?viz=reactflow-v2&layout=sugiyama

# HSM combobox with Grid layout, custom settings
http://localhost:4321/matchina/examples/hsm-combobox?viz=reactflow-v2&layout=grid&settings=%7B%22cols%22%3A4%2C%22direction%22%3A%22row%22%7D
```

### 📸 Visualizer-Only Screenshot Capture
```bash
# Basic capture (visualizer areas only, not whole pages)
./scripts/capture-enhanced-screenshots.sh basic

# Capture all visualizers with app defaults
./scripts/capture-enhanced-screenshots.sh all

# Target specific configurations
./scripts/capture-enhanced-screenshots.sh -e traffic-light -l grid
```

**Features:**
- **Visualizer-only capture** - Captures just the visualizer component area
- **No page chrome** - Tests layout functionality without UI interference
- **App defaults** - Tests app's default settings, no hardcoded presets
- **Automatic dark mode** - Built-in color scheme
- **Progress tracking** - Clear success/failure reporting
- **Direct output** - Files saved directly to target directory

### 🖼️ Fast Example Gallery Capture
```bash
# Capture all examples with defaults (FAST!)
./scripts/capture-example-gallery.sh

# Updates documentation gallery automatically
# Generates: review/EXAMPLE_GALLERY.md
```

**Features:**
- **Lightning fast** - Captures 13 examples with defaults
- **No layout switching** - Uses each example's default visualizer
- **Auto documentation** - Generates markdown gallery with all images
- **Visual overview** - See every example at a glance
- **Quick updates** - Re-run to refresh entire gallery
- **Proper auto-zoom** - Waits for ReactFlow V2 auto-zoom to complete
- **MachineVisualizer only** - Only captures actual visualizer components

**Perfect for:**
- Quick visual verification of all examples
- Documentation updates
- Review meetings
- Portfolio/showcase

### 🔧 URL Builder Utility
```bash
# Generate URLs for testing
./scripts/build-visualizer-urls.sh

# Direct screenshot with custom URL (app handles settings)
npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector="[data-testid='reactflow-visualizer']" "http://localhost:4321/matchina/examples/traffic-light?viz=reactflow-v2&layout=grid" screenshot.png
```

### 🎛️ Visualizer Options
- `reactflow-v2` - ReactFlow V2 (default)
- `reactflow` - Original ReactFlow
- `sketch` - Sketch visualizer
- `forcegraph` - ForceGraph visualizer
- `mermaid-statechart` - Mermaid statechart
- `mermaid-flowchart` - Mermaid flowchart

### ⚙️ Layout Options
- `sugiyama` - ELK layered algorithm
- `tree` - ELK mrtree algorithm
- `force` - ELK force algorithm
- `organic` - ELK stress algorithm
- `circular` - ELK radial algorithm
- `grid` - Custom grid layout

### 📋 Available Examples (13 total)
**Basic (4)**: traffic-light, toggle, counter, rock-paper-scissors
**Hierarchical (3)**: hsm-combobox, hsm-traffic-light, hsm-checkout
**Advanced (3)**: async-calculator, auth-flow, checkout
**Testing (2)**: reactflow-subflow-test, stopwatch
**Extended (1)**: traffic-light-extended

**Note**: Only examples using `MachineVisualizer` with ReactFlow visualizers are captured. Examples like `stopwatch-overview`, `paren-checker`, and `color-scheme-explorer` use different components and are not included.

---

## Next Actions

### Immediate (This Session)
1. [ ] Set browser to dark mode
2. [ ] Test Tree layout with traffic light
3. [ ] Test Tree layout with HSM combobox
4. [ ] Test Force layout with traffic light
5. [ ] Test Force layout with HSM combobox
6. [ ] Update screenshots and status

### Following Sessions
1. [ ] Fix Circular layout with graphviz.circo
2. [ ] Test fixed Circular layout
3. [ ] Complete screenshot gallery
4. [ ] Review all layouts for quality

---

*Last Updated: Current session*  
*Browser: Dark Mode*  
*Status: 5/6 layouts working, 1 broken, 5/18 screenshots captured*
