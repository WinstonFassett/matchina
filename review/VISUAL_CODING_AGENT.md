# Visual Coding Agent Guide
**Visual-First Development Methodology for Coding Agents**

---

## 🎯 **Purpose**

This guide defines the **Visual Coding Agent** - a coding agent whose primary verification method is visual analysis. Unlike traditional coding agents that rely solely on unit tests and console output, Visual Coding Agents use visual validation as their default verification approach, only falling back to non-visual methods when visual verification isn't necessary or possible.

---

## 🖼️ **Visual-First Development Philosophy**

### **Core Principle**: **If you can see it, verify it visually**

Visual Coding Agents prioritize visual verification because:
- **UI/Visual bugs** are often invisible to unit tests
- **Edge routing**, **layout**, and **styling** issues are inherently visual
- **User experience** can only be validated visually
- **Parallel edge separation**, **node positioning**, and **visual hierarchy** require visual assessment

### **When Visual Verification is Required**:
- ✅ **UI Components**: ReactFlow nodes, edges, layouts
- ✅ **Visual Algorithms**: Edge routing, parallel separation, curvature
- ✅ **Styling Issues**: Themes, colors, contrast, accessibility
- ✅ **Layout Problems**: Node overlap, positioning, hierarchy
- ✅ **User Experience**: Interaction flows, state transitions

### **When Non-Visual Verification is Acceptable**:
- ✅ **Pure Logic**: State machine transitions, business rules
- ✅ **Performance**: Algorithm complexity, memory usage
- ✅ **API Integration**: Data fetching, error handling
- ✅ **Type Safety**: TypeScript compilation, interface contracts
- ❌ **npm test**: FUCKING USELESS for visual development

---

## 🌙 **Dark Theme Methodology**

### **Default Theme**: Dark Mode
Visual Coding Agents should default to dark theme for all visual captures because:
- **Better contrast** for edge visualization and node highlighting
- **Consistent** with development environment preferences
- **Professional appearance** for documentation and galleries
- **Reduced eye strain** during extended visual analysis sessions

### **Theme Implementation**:
```javascript
// Set dark theme (default approach)
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(200);

// Alternative: Set data-theme attribute
await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});
await page.waitForTimeout(300);
```

### **Theme Verification**:
```javascript
// Verify dark theme is active
const isDarkTheme = await page.evaluate(() => {
  return document.documentElement.getAttribute('data-theme') === 'dark' ||
         window.matchMedia('(prefers-color-scheme: dark)').matches;
});

if (!isDarkTheme) {
  console.log('⚠️ Dark theme not properly applied');
}
```

---

## 🔍 **Visual Verification Methodology**

### **Targeted vs Full Context**

#### **Targeted Debugging** (Preferred for Development):
- **Size**: `300x500` to `400x600` - Focused visualizer only
- **Purpose**: Debug specific issues, edge routing, component behavior
- **Advantage**: Clear focus on the problem area
- **When to use**: Algorithm development, edge case debugging

#### **Full Context** (For QA/Smoke Tests):
- **Size**: `1280x720` - Full app + visualizer
- **Purpose**: Complete user experience validation
- **Advantage**: Shows interaction context, theme integration
- **When to use**: Final validation, user experience testing

#### **Tiny = Broken** (Never Acceptable):
- **Size**: `<50x50` - Magnifying glasses, broken renders
- **Problem**: Visualizer not loaded, selector wrong, timing issues
- **Solution**: Debug visualizer loading, check selectors, increase wait times

---

## 🎨 **Visualizer-Specific Capture Strategies**

### **ReactFlow**:
```javascript
// Targeted - visualizer only
const reactFlowPane = await page.$('.react-flow__pane');
await reactFlowPane.screenshot({ path: filepath });

// Full context - app + visualizer  
const mainContent = await page.$('.machine-visualizer > div:last-child');
await mainContent.screenshot({ path: filepath });
```

### **ForceGraph**:
```javascript
// Targeted - canvas only
const canvas = await page.$('canvas');
await canvas.screenshot({ path: filepath });

// Full context - app + canvas
const mainContent = await page.$('.machine-visualizer > div:last-child');
await mainContent.screenshot({ path: filepath });
```

### **Mermaid**:
```javascript
// Targeted - SVG container (use test ID)
const mermaidContainer = page.getByTestId('mermaid-statechart-container');
await mermaidContainer.screenshot({ path: filepath });

// Full context - app + visualizer
const mainContent = await page.$('.machine-visualizer > div:last-child');
await mainContent.screenshot({ path: filepath });
```

---

## 🤖 **Visual Coding Agent Workflow**

### **Step 1: Visual Coding Agent Implementation**
```javascript
// Visual Coding Agent implements visual algorithm
const curvature = calculateParallelEdgeCurvature(edges);
await updateParallelEdgeComponent(curvature);
```

### **Step 2: Visual Verification (Default)**
```javascript
// Dark theme is now global default in playwright.config.ts
// No manual setup needed - tests start in dark mode automatically

// Capture visual result for verification
const visualizer = await page.$('.react-flow__pane');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filepath = `review/screenshots/verify-${feature}-${timestamp}.png`;
await visualizer.screenshot({ path: filepath });

// Handoff to Vision Agent for analysis
const analysis = await analyzeWithVisionAgent(filepath, feature);
```

### **Step 3: Vision Agent Analysis**
```bash
# Vision Agent provides visual quality assessment
ollama run llava "review/screenshots/verify-${feature}-${timestamp}.png" <<EOF
Analyze this ${visualizer} visualization for ${feature} implementation quality.

Focus on:
1. **Visual Correctness**: Does the implementation work visually?
2. **Edge Separation**: Are parallel edges properly separated?
3. **User Experience**: Is the visual result intuitive?
4. **Quality Score**: Rate from 1-10 with specific feedback.

Provide actionable recommendations for improvement.
EOF
```

### **Step 4: Results Integration**
```javascript
// Visual Coding Agent integrates visual feedback
if (analysis.score >= 8) {
  await markFeatureComplete(feature);
  await updateVisualGallery(analysis);
} else {
  await implementImprovements(analysis.recommendations);
  await repeatVisualVerification();
}
```

---

## 📊 **Multi-Visualizer Comparison Methodology**

### **Consistent Capture Setup**:
```javascript
const VISUALIZERS = {
  reactflow: {
    selector: '.react-flow__pane',
    waitSelector: '.react-flow__node',
    name: 'ReactFlow'
  },
  forcegraph: {
    selector: 'canvas', 
    waitSelector: 'canvas',
    name: 'ForceGraph'
  },
  'mermaid-statechart': {
    selector: '[data-testid="mermaid-statechart-container"]',
    waitSelector: 'svg',
    name: 'Mermaid Statechart'
  }
};
```

### **Capture Function**:
```javascript
async function captureVisualizer(page, visualizer, example, focused = true) {
  const config = VISUALIZERS[visualizer];
  
  // Switch visualizer
  await page.getByTestId('visualizer-picker').selectOption(visualizer);
  await page.waitForSelector(config.waitSelector, { timeout: 3000 });
  
  // Capture
  const selector = focused ? config.selector : '.machine-visualizer > div:last-child';
  const element = await page.$(selector);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${example}-${visualizer}-${focused ? 'focused' : 'full'}-${timestamp}.png`;
  const filepath = `review/screenshots/${filename}`;
  
  await element.screenshot({ path: filepath });
  console.log(`✅ Captured: ${filename}`);
  
  return { filepath, filename, visualizer, focused };
}
```

---

## 🔧 **Debugging Visual Capture Issues**

### **Problem: Tiny Images (<50x50)**
```javascript
// Check visualizer actually loaded
const element = await page.$(selector);
const bbox = await element.boundingBox();
if (bbox.width < 50 || bbox.height < 50) {
  console.log('❌ Visualizer not properly loaded');
  console.log('Bounding box:', bbox);
  
  // Debug: What's actually in the container?
  const html = await element.innerHTML();
  console.log('Container HTML:', html);
}
```

### **Problem: Wrong Selector**
```javascript
// Verify selector exists
const exists = await page.$(selector) !== null;
if (!exists) {
  console.log('❌ Selector not found:', selector);
  
  // Find alternative selectors
  const alternatives = await page.$$eval('*', elements => 
    elements.map(el => ({
      tag: el.tagName.toLowerCase(),
      class: el.className,
      id: el.id,
      testId: el.getAttribute('data-testid')
    }))
  );
  console.log('Available elements:', alternatives);
}
```

### **Problem: Timing Issues**
```javascript
// Wait for visualizer to be ready
await page.waitForSelector(waitSelector, { timeout: 5000 });
await page.waitForTimeout(1000); // Additional render time

// Verify visualizer has content
const hasContent = await page.evaluate((selector) => {
  const element = document.querySelector(selector);
  return element && element.children.length > 0;
}, selector);
```

---

## 📈 **Quality Assurance Checklist**

### **Before Handoff to Vision Agent**:
- [ ] Image size > 100x100 pixels
- [ ] Visualizer content visible (not empty/broken)
- [ ] Consistent aspect ratio across comparisons
- [ ] Proper naming convention (example-visualizer-timestamp.png)
- [ ] File size reasonable (>1KB for real content)

### **Vision Agent Analysis**:
- [ ] Specific feedback on target issue
- [ ] Quality score (1-10) with justification
- [ ] Actionable improvement recommendations
- [ ] Comparison to baseline/benchmark

### **Results Integration**:
- [ ] Analysis logged to review documentation
- [ ] Gallery updated with new images
- [ ] Improvement tickets created if needed
- [ ] Progress tracking updated

---

## 🎯 **Best Practices**

### **For Development Debugging**:
1. **Use focused captures** (`300x500`) for algorithm work
2. **Capture before/after** for each change
3. **Verify visualizer loaded** before screenshot
4. **Use consistent naming** for easy comparison

### **For Multi-Visualizer Comparison**:
1. **Same example** across all visualizers
2. **Same capture method** (focused or full)
3. **Consistent timing** (wait for full render)
4. **Document differences** in visual approaches

### **For Vision Agent Handoff**:
1. **Clear analysis prompt** with specific criteria
2. **Quality benchmarks** for comparison
3. **Actionable output format** for integration
4. **Feedback loop** for iterative improvement

---

## 🔄 **Visual Coding Agent Pattern**

```
Visual Coding Agent → Implement Visual Feature → Visual Verification → Vision Agent Analysis
        ↓                                                            ↓
Refine Implementation ← Get Visual Feedback ← Vision Agent ← Analyze Visual Quality
        ↓                                                            ↓
Mark Complete ← Update Visual Gallery ← Log Results ← Integration Loop
```

---

## 🔗 **Related Documentation**

- **[PLAYWRIGHT_DARK_THEME.md](./PLAYWRIGHT_DARK_THEME.md)** - Complete Playwright dark theme configuration guide
- **[AGENT_COMMANDS.md](./AGENT_COMMANDS.md)** - Agent-safe command guidelines
- **[reactflow-toggle-edge-comparison.md](./reactflow-toggle-edge-comparison.md)** - Dark theme visual examples

---

## 🎯 **Visual Coding Agent Best Practices**

### **Dark Theme Default**:
- Always use dark theme for visual captures
- Better contrast for edge analysis and node highlighting
- Consistent professional appearance in documentation
- Reduced eye strain during extended analysis

### **Visual Verification**:
- Verify theme application before capture
- Check file sizes to ensure proper captures
- Use consistent naming conventions
- Document theme methodology in galleries

### **Quality Assurance**:
- Pre-handoff: Dark theme applied, content visible, consistent naming
- Vision analysis: Dark theme optimized prompts and criteria
- Results integration: Update dark theme galleries and documentation

### **Image Verification (CRITICAL)**:
- **ALWAYS verify images before using**: See [IMAGE_VERIFICATION_CHECKLIST.md](./IMAGE_VERIFICATION_CHECKLIST.md)
- **Check file size**: <1KB = broken, >10KB = likely good
- **Check dimensions**: <100x100 = broken, 300x500 = focused visualizer
- **Open and verify**: Actually look at the image before using it
- **Content verification**: Confirm nodes, edges, labels visible

### **Path Convention for Documentation**:
- **Obsidian context**: Use `review/screenshots/filename.png` (from project root)
- **Web context**: Use `screenshots/filename.png` (from /review/ directory)
- **Critical**: Always test image paths in the actual viewing context

---

*This guide establishes the methodology for visual coding agent workflows, ensuring proper capture, analysis, and collaboration between coding and vision agents with dark theme as the default approach.*
