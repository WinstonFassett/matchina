# Image Verification Checklist
**STOP BEING STUPID - VERIFY YOUR VISUALS**

---

## 🔍 **Pre-Analysis Verification**

### **Step 1: File Size Check**
```bash
# Tiny files = broken captures
ls -la screenshot.png
# < 1KB = probably broken (magnifying glass, icon, etc.)
# 1-10KB = might be app UI instead of visualizer
# > 10KB = likely real visualization
```

### **Step 2: Dimensions Check**
```bash
# Check actual dimensions
file screenshot.png
# < 100x100 = broken (icon, magnifying glass)
# 300x500 = focused visualizer (good)
# 1280x720 = full page (might be app UI)
# 1280x3600+ = full page with content (good)
```

### **Step 3: Content Verification**
```bash
# Quick visual check - open the image!
open screenshot.png
# OR
# Look at it in your image viewer
```

---

## ✅ **What to Look For**

### **Valid Graph Visualizations**:
- **Nodes**: Circles, rectangles, or other shapes representing states
- **Edges**: Lines/curves connecting the nodes
- **Labels**: Text on or near edges showing transitions
- **Layout**: Organized positioning, not random UI elements

### **Invalid/Broken Captures**:
- **App UI**: Browser chrome, navigation bars, controls
- **Magnifying Glasses**: Tiny 14x14px icons (broken Mermaid)
- **Empty Space**: Large areas with no graph content
- **Text Only**: No visual graph elements
- **Error Pages**: Broken rendering, error messages

---

## 🚨 **Red Flags - STOP HERE IF YOU SEE THESE**

### **File Size Issues**:
- ❌ **< 500 bytes**: Definitely broken
- ❌ **< 5KB**: Probably broken, verify carefully
- ✅ **> 10KB**: Likely good, but still verify

### **Dimension Issues**:
- ❌ **< 50x50**: Icon/magnifying glass
- ❌ **Exactly 14x15**: Broken Mermaid rendering
- ✅ **300x500**: Focused visualizer
- ✅ **1280x720**: Full page (verify it's not just UI)

### **Content Issues**:
- ❌ **Browser chrome visible**: Wrong selector
- ❌ **Navigation elements**: Wrong capture area
- ❌ **No graph nodes/edges**: Wrong visualizer or broken
- ✅ **Clear graph structure**: Good to go

---

## 🔧 **Common Fixes**

### **If App UI Instead of Visualizer**:
```javascript
// Wrong: Capturing whole page
await page.screenshot({ path: filepath });

// Right: Capture specific visualizer
const visualizer = await page.$('.react-flow__pane');
await visualizer.screenshot({ path: filepath });
```

### **If Tiny Icon/Magnifying Glass**:
```javascript
// Wrong: Visualizer not loaded
await page.waitForTimeout(100);

// Right: Wait for actual content
await page.waitForSelector('.react-flow__node', { timeout: 5000 });
```

### **If Empty/Broken**:
```javascript
// Verify visualizer actually loaded
const content = await page.evaluate(() => {
  const element = document.querySelector('.react-flow__pane');
  return element && element.children.length > 0;
});

if (!content) {
  console.log('❌ Visualizer not loaded');
  return;
}
```

---

## 📋 **Verification Workflow**

### **Before Using Image in Documentation**:
1. **Check file size**: `ls -la screenshot.png`
2. **Check dimensions**: `file screenshot.png`  
3. **Open and verify**: `open screenshot.png`
4. **Confirm content**: Nodes, edges, labels visible?
5. **Check for red flags**: No UI chrome, no tiny icons

### **Before Sending to Vision Agent**:
1. **All above steps**
2. **Describe what you expect to see**
3. **Ask vision agent to confirm expectations**
4. **If mismatched**: Fix capture, don't use the image

---

## 🎯 **The Golden Rule**

**IF YOU HAVEN'T ACTUALLY LOOKED AT THE IMAGE, DON'T USE IT**

- Open it in an image viewer
- Verify it shows what you think it shows
- Check file size and dimensions
- Only then use it for analysis or documentation

---

**STOP BEING STUPID - VERIFY YOUR VISUALS BEFORE USING THEM**
