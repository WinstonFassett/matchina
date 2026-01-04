# Playwright Dark Theme Guide
**Global Dark Mode Configuration for Visual Testing**

---

## 🌙 **Why Dark Theme Default**

### **Visual Analysis Benefits**:
- **Better Edge Contrast**: Dark backgrounds make edge routing and separation more visible
- **Node Highlighting**: Active states and node boundaries stand out clearly
- **Reduced Eye Strain**: Extended visual analysis sessions are more comfortable
- **Professional Documentation**: Dark theme screenshots look more polished in galleries
- **Consistent Environment**: Matches common development IDE preferences

### **Technical Advantages**:
- **CSS Variables**: Dark theme uses well-defined CSS custom properties
- **Theme Detection**: Reliable theme state detection and verification
- **Cross-Visualizer**: All visualizers (ReactFlow, ForceGraph, Mermaid) support dark theme
- **Playwright Support**: Built-in color scheme emulation for consistent testing

---

## 🔧 **Implementation Methods**

### **Method 1: Color Scheme Emulation** (Default - Global)
```javascript
// Playwright global configuration (playwright.config.ts)
use: {
  colorScheme: 'dark', // Global default: dark mode for all tests
}

// No manual setup needed in tests - dark mode is automatic
// Tests start in dark mode by default
```

**Advantages**:
- Global default - all tests start in dark mode
- No manual setup required in individual tests
- Consistent across all test files
- Light mode must be explicitly requested when needed

### **Method 2: Data Theme Attribute**
```javascript
// Set data-theme attribute
await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});
await page.waitForTimeout(300);
```

**When to Use**:
- When color scheme emulation doesn't work
- For specific visualizer theme requirements
- When testing theme switching behavior

### **Method 3: Manual Override** (When Explicit Control Needed)
```javascript
// Override global setting for specific test
await page.emulateMedia({ colorScheme: 'light' }); // Explicit light mode
await page.waitForTimeout(200);

// Or back to dark
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(200);
```

**When to Use**:
- When testing light mode specifically
- When testing theme switching behavior
- When comparing both themes in same test

### **Method 4: Combined Approach** (Most Reliable)
```javascript
// Set both for maximum compatibility
await page.emulateMedia({ colorScheme: 'dark' });
await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});
await page.waitForTimeout(300);
```

---

## ✅ **Theme Verification**

### **Verification Function**:
```javascript
async function verifyDarkTheme(page) {
  const isDarkTheme = await page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  if (!isDarkTheme) {
    console.log('⚠️ Dark theme not properly applied');
    return false;
  }
  
  console.log('✅ Dark theme verified');
  return true;
}
```

### **CSS Variable Verification**:
```javascript
const cssVars = await page.evaluate(() => {
  const styles = getComputedStyle(document.documentElement);
  return {
    textColor: styles.getPropertyValue('--sl-color-text'),
    bgColor: styles.getPropertyValue('--sl-color-bg'),
    accentColor: styles.getPropertyValue('--sl-color-accent')
  };
});

console.log('🎨 Dark theme CSS variables:', cssVars);
```

---

## 📸 **Visualizer-Specific Dark Theme**

### **ReactFlow**:
```javascript
// ReactFlow respects system color scheme
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForSelector('.react-flow__node', { timeout: 3000 });

// Capture focused visualizer
const reactFlowPane = await page.$('.react-flow__pane');
await reactFlowPane.screenshot({ path: filepath });
```

### **ForceGraph**:
```javascript
// ForceGraph uses CSS variables for theming
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForSelector('canvas', { timeout: 3000 });

// Capture canvas
const canvas = await page.$('canvas');
await canvas.screenshot({ path: filepath });
```

### **Mermaid**:
```javascript
// Mermaid has extensive dark theme CSS rules
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForSelector('[data-testid="mermaid-statechart-container"]', { timeout: 3000 });

// Capture Mermaid container
const mermaidContainer = page.getByTestId('mermaid-statechart-container');
await mermaidContainer.screenshot({ path: filepath });
```

---

## 🎯 **Best Practices**

### **Always Use Dark Theme For**:
- **Edge Routing Analysis**: Better visibility of curved paths and separation
- **Node Layout Debugging**: Clearer boundaries and positioning
- **State Highlighting**: Active states stand out against dark backgrounds
- **Documentation Screenshots**: Professional appearance in galleries
- **Vision Agent Analysis**: Better contrast for AI visual analysis
- **Visual Development**: Because npm test is FUCKING USELESS for visual work

### **Theme Verification Checklist**:
- [ ] Color scheme set to dark
- [ ] Data-theme attribute applied (if needed)
- [ ] Visualizer loaded in dark theme
- [ ] CSS variables properly applied
- [ ] Screenshot shows dark theme

### **File Naming Convention**:
```
{example}-{visualizer}-dark-{focused|full}-{timestamp}.png
```

**Examples**:
- `toggle-reactflow-dark-focused-2026-01-04T16-30-00-000Z.png`
- `toggle-forcegraph-dark-full-2026-01-04T16-30-00-000Z.png`
- `toggle-mermaid-statechart-dark-focused-2026-01-04T16-30-00-000Z.png`

---

## 🔄 **Integration with Visual Coding Agent Workflow**

### **Updated Workflow**:
```
Visual Coding Agent → Set Dark Theme → Implement Feature → Visual Verification → Vision Agent
        ↓                                                            ↓
Refine Implementation ← Get Visual Feedback ← Vision Agent ← Analyze Dark Theme Results
```

### **Capture Script Template**:
```javascript
// Visual Coding Agent - Dark Theme Capture
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(200);

await verifyDarkTheme(page);

const visualizer = await page.$(selector);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filepath = `review/screenshots/${feature}-dark-${timestamp}.png`;

await visualizer.screenshot({ path: filepath });
```

---

## 📚 **Related Documentation**

- **[VISUAL_CODING_AGENT.md](./VISUAL_CODING_AGENT.md)** - Complete visual-first development methodology
- **[AGENT_COMMANDS.md](./AGENT_COMMANDS.md)** - Agent-safe command guidelines
- **[reactflow-toggle-edge-comparison.md](./reactflow-toggle-edge-comparison.md)** - Dark theme visual examples

---

*This guide establishes dark theme as the default for all Playwright visual testing, ensuring consistency and optimal visual analysis conditions.*
