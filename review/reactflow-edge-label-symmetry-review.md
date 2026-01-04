# ReactFlow Edge Label Symmetry Review

## 🎯 Current State & What We've Achieved

### ✅ What's Working (Vertical Layout)
- **All 4 labels visible** - No more overlap issues
- **Clockwise flow correct** - Gray labels (On→Off) on right, Blue labels (Off→On) on left  
- **Proper separation** - 40px between parallel labels
- **Viewport bounds** - All labels within visible area
- **TypeScript clean** - No compilation errors

### ❌ What's Still Fucked Up
1. **ASYMMETRICAL EDGE CURVATURE** - Blue edges (left) bow out much farther than gray edges (right)
2. **INCONSISTENT LABEL POSITIONING** - Labels don't follow clear logical rules
3. **ONLY WORKS FOR VERTICAL LAYOUT** - Horizontal/side-by-side layout not addressed
4. **LABEL OFFSET LOGIC IS CONFUSING** - Current rules make no sense

## 🔍 Current Label Positioning Logic (Vertical Layout)

### Right Side (Gray edges - On→Off):
- **First edge (80px offset)**: `labelX = centerX + 15px`
- **Second edge (140px offset)**: `labelX = centerX + 55px`

### Left Side (Blue edges - Off→On):  
- **First edge (200px offset)**: `labelX = centerX - 5px`
- **Second edge (260px offset)**: `labelX = centerX - 45px`

**PROBLEM:** The left side labels are much closer to center than right side labels, making it asymmetrical.

## 📐 Edge Offset Increments

```typescript
// Right side (positive offsets)
edgeOffset = 80 + (index * 60);  // 80px, 140px

// Left side (negative offsets)  
edgeOffset = -(80 + (index * 60));  // -200px, -260px
```

**PROBLEM:** Left side starts at -200px (not -80px), creating asymmetry.

## 🎭 The ReactFlow vs ForceGraph Challenge

### ForceGraph (Easy Mode):
- **Simple coordinate system** - Direct x/y positioning
- **Predictable edge rendering** - Straight lines or simple curves
- **Easy label positioning** - Just calculate midpoint and offset

### ReactFlow (Hard Mode):
- **Complex edge path system** - Quadratic Bezier curves with control points
- **Viewport clipping** - Labels outside bounds disappear
- **EdgeLabelRenderer constraints** - Must use ReactFlow's positioning system
- **Bidirectional edge complexity** - Multiple parallel edges need different handling

## 🐛 Core Issues Identified

### 1. Asymmetrical Edge Offsets
**Current:** Right side: 80px, 140px | Left side: -200px, -260px  
**Should be:** Right side: 80px, 140px | Left side: -80px, -140px

### 2. Inconsistent Label Offsets
**Current:** Right: +15px, +55px | Left: -5px, -45px  
**Should be:** Right: +15px, +55px | Left: -15px, -55px (symmetrical)

### 3. No Horizontal Layout Support
**Current:** Only works for vertical (top/bottom) node arrangement  
**Should be:** Also work for horizontal (left/right) node arrangement

## 🎯 Target Symmetry Goal

### Ideal State (Vertical Layout):
```
    On (50, 50)           Off (50, 180)
         ↘15px                ↘15px
    turnOff (65, 140)      turnOn (35, 140)
         ↘55px                ↘55px  
    toggle (75, 140)      toggle (25, 140)
```

### Ideal State (Horizontal Layout):
```
On (50, 100) ────────────── Off (200, 100)
     ↓15px                    ↓15px
 turnOff (100, 85)         turnOn (150, 85)
     ↓55px                    ↓55px  
  toggle (100, 115)        toggle (150, 115)
```

## 🔧 Proposed Solutions

### Solution 1: Fix Edge Offset Symmetry
```typescript
// Make left side start at -80px instead of -200px
if (dy > 0) { // Going downward
  edgeOffset = 80 + (index * 60);
} else if (dy < 0) { // Going upward  
  edgeOffset = -(80 + (index * 60)); // Start at -80px, not -200px
}
```

### Solution 2: Fix Label Offset Symmetry  
```typescript
// Make label offsets symmetrical
if (dy > 0) { // Going downward - curve to right
  labelX = (sourceX + targetX) / 2 + (offsetMagnitude === 80 ? 15 : 55);
} else if (dy < 0) { // Going upward - curve to left  
  labelX = (sourceX + targetX) / 2 - (offsetMagnitude === 80 ? 15 : 55); // Symmetrical!
}
```

### Solution 3: Add Horizontal Layout Support
```typescript
if (Math.abs(dx) > Math.abs(dy)) { // Horizontal layout
  if (dx > 0) { // Going right - curve down
    labelY = (sourceY + targetY) / 2 + (offsetMagnitude === 80 ? 15 : 55);
  } else if (dx < 0) { // Going left - curve up
    labelY = (sourceY + targetY) / 2 - (offsetMagnitude === 80 ? 15 : 55);
  }
}
```

## 🚧 Open Issues (Beads/TODO)

### High Priority:
1. **[BEAD-ID]** Fix edge offset symmetry - Left side should start at -80px
2. **[BEAD-ID]** Fix label offset symmetry - Both sides should use same offset magnitudes  
3. **[BEAD-ID]** Add horizontal layout support - Side-by-side node arrangement
4. **[BEAD-ID]** Create consistent positioning rules - Make logic understandable

### Medium Priority:
1. **[BEAD-ID]** Simplify label positioning logic - Current rules are confusing
2. **[BEAD-ID]** Add visual tests for both layouts - Prevent regressions
3. **[BEAD-ID]** Document edge offset strategy - For future reference

## 📚 Lessons Learned

### ReactFlow Edge Label Positioning:
1. **Never trust visual reasoning** - Use coordinate analysis tools
2. **EdgeLabelRenderer is picky** - Must use transform with translate()
3. **Viewport boundaries matter** - Labels outside bounds disappear
4. **Parallel edges need different offsets** - Same position = overlap

### Edge Curvature & Label Relationship:
1. **Edge offset controls curve magnitude** - Larger offset = bigger bow
2. **Label position should relate to curve** - But not too far from edge
3. **Symmetry requires matching offsets** - Positive/negative should mirror
4. **Clockwise flow affects handle positions** - Right vs left exits/entries

### Development Process:
1. **Coordinate analyzer tools are essential** - Can't eyeball this shit
2. **Start simple, add complexity** - Basic positioning first, then enhancements
3. **Test both layouts** - Vertical and horizontal have different requirements
4. **Commit working states** - Don't lose progress to experiments

## 🔄 Next Steps

### Immediate (This Session):
1. Fix edge offset symmetry (left side starts at -80px)
2. Fix label offset symmetry (both sides use same magnitudes)
3. Test and verify vertical layout symmetry

### Short Term (Next Session):
1. Add horizontal layout support
2. Create consistent positioning rules
3. Add visual tests for both layouts

### Long Term:
1. Generalize solution for any node arrangement
2. Create reusable edge labeling system
3. Document best practices for ReactFlow edge labels

---

## 🎯 Success Criteria

### When We're Done:
- ✅ **Symmetrical edge curves** - Left and right sides mirror each other
- ✅ **Consistent label positioning** - Clear, logical rules for both layouts  
- ✅ **Both layouts work** - Vertical AND horizontal arrangements
- ✅ **All labels visible** - No overlap, no viewport issues
- ✅ **Clean, understandable code** - Future maintainers can understand the logic

### Visual Test:
- **Vertical layout**: Two nodes, 4 edges, symmetric "bow" shape, labels evenly spaced
- **Horizontal layout**: Two nodes, 4 edges, symmetric "bow" shape, labels evenly spaced
- **Both layouts**: Labels positioned consistently relative to their edges

---

*Last Updated: 2025-01-04*
*Status: In Progress - Vertical layout working, horizontal layout pending*
