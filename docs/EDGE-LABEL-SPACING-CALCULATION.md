# Edge Label Spacing Requirements

## User's Critical Requirement

**"We need to consider spacing between nodes that allows for roughly a 75-100% of an average node width between them to accommodate EDGE labels!"**

## Current vs Required Spacing

### Current Implementation (WRONG)
```typescript
nodeSpacing: 150,    // Only ~1.1x node width
```

### Required Implementation
Based on 132px average node width:
- **Edge label space**: 75-100% of node width = 99-132px
- **Total spacing needed**: Node (132px) + Edge label (99-132px) + Node (132px)
- **Center-to-center spacing**: 132px + 99px + 132px = 363px minimum
- **Center-to-center spacing**: 132px + 132px + 132px = 396px maximum

### Recommended Defaults
```typescript
nodeSpacing: 400,    // ~3.0x node width for edge labels
layerSpacing: 300,   // Increased for edge labels between layers
```

## Spacing Formula

For adjacent nodes with edge labels:
```
Node1 (66px) + Edge Label (99-132px) + Node2 (66px) = 231-264px edge-to-edge
Node1 center to Node2 center = 132px + 99-132px + 132px = 363-396px
```

## Impact on Different Layouts

### Linear Chain (1→2→3)
- Edge labels between nodes need full spacing
- Current 150px spacing is insufficient for edge labels

### Branching Graph (1→[2,3]→4)  
- Nodes 2 and 3 need spacing for their edge labels to 4
- Need even more spacing for multiple edge labels

### Hierarchical Layouts
- Parent-child edges need label space
- Sibling edges need label space
- Cross-layer edges need label space

## Required Updates

1. **Increase nodeSpacing to 400px** (3.0x node width)
2. **Increase layerSpacing to 300px** (6.0x node height)
3. **Update UI ranges** to accommodate larger values
4. **Test with actual edge labels** to verify spacing works
5. **Update descriptions** to mention edge label accommodation
