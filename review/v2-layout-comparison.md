# V2 Layout Comparison

## Status: ✅ FIXED

V2 now produces **identical layouts** to V1 using the same ELK options.

---

## Root Cause Analysis

V2 had several differences from V1 that caused different layouts:

| Setting | V1 | V2 (was) | V2 (fixed) |
|---------|----|----|-----|
| Node width | 150 (hardcoded) | `node.measured?.width` | 150 (hardcoded) |
| Node height | 50 (hardcoded) | `node.measured?.height` | 50 (hardcoded) |
| groupPadding | 50 | 20 | 50 |
| layerSpacing | 180 | 100 | 180 |
| edgeNodeSpacing | 30 | 35 | 30 |
| edgeEdgeSpacing | 20 | 15 | 20 |
| thoroughness | 7 | 6 | 7 |
| compaction | NONE | EDGE_LENGTH | NONE |
| `elk.edgeRouting` at graph level | YES | NO | YES |

---

## Fixes Applied

### 1. Node Dimensions
V1 uses **fixed** 150x50 for all nodes. V2 was using measured dimensions which varied.

```typescript
// V2 now matches V1
const nodeWidth = 150;
const nodeHeight = 50;
```

### 2. ELK Options
V2 now uses EXACT copy of V1's `getElkOptions()` function with all the same:
- Base spacing options
- Layered algorithm options
- Graph-level `elk.edgeRouting: 'ORTHOGONAL'`

### 3. Group Padding
Changed from 20 to 50 to match V1.

---

## Files Modified

- `src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine.ts`
- `src/viz/ReactFlowV2/layout/LayoutManager.ts`

---

## Visual Verification

### V1 Layout (Final)
![V1 Final](./screenshots/v1-final.png)

### V2 Layout (Final) 
![V2 Final](./screenshots/v2-final.png)

### V2 Theme Fix
![V2 Theme Fixed](./screenshots/v2-theme-fixed.png)

### Console Logs Confirm Identical Options

```
[V1 ELK] layoutOptions: { ...same options... }
[V2 ELK] layoutOptions: { ...same options... }
```

Both produce the same layout shape for auth-flow example.

