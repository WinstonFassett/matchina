# ELK Layout Dimensions Calculation

## Node and Label Assumptions

Based on user guidance:
- **Node width**: 100px (standard ReactFlow node)
- **Node height**: 50px (standard ReactFlow node)  
- **Label width**: ~25px (half node width)
- **Label height**: ~12px (half node height)

## Spacing Calculations

### Horizontal Spacing (nodeSpacing)
For adjacent nodes horizontally:
```
Node1 (50px) + Spacing + Label (12.5px) + Spacing + Node2 (50px)
```

**Minimum comfortable spacing**: 25px
- 50px (half node) + 25px (spacing) + 12.5px (half label) + 25px (spacing) + 50px (half node) = 162.5px total
- This gives 25px clear space between edges

**Recommended**: 120px (current default)
- Provides ample space for labels and visual clarity
- Accounts for edge routing curves and labels

### Vertical Spacing (layerSpacing)
For nodes in different layers:
```
Node1 (25px height) + Spacing + Label (6px height) + Spacing + Node2 (25px height)
```

**Minimum comfortable spacing**: 40px
- 25px (half node) + 40px (spacing) + 6px (half label) + 40px (spacing) + 25px (half node) = 136px total
- This gives 40px clear space between layers

**Recommended**: 180px (current default)
- Provides good visual separation between layers
- Accounts for edge labels and routing

### Edge Spacing (edgeNodeSpacing, edgeEdgeSpacing)
**Edge to Node spacing**: 30px (current default)
- Provides clearance between edges and node boundaries
- Important for edge labels to not overlap nodes

**Edge to Edge spacing**: 15px (current default)
- Minimum spacing between parallel edges
- Important for bidirectional transitions

## ReactFlow Node Dimensions

Based on ReactFlow default styling:
- **Default node**: 150px × 50px
- **Compact node**: 120px × 40px  
- **Large node**: 200px × 60px

## Updated Recommendations

### For Standard ReactFlow Nodes (150px × 50px):
```typescript
nodeSpacing: 150,    // 1.0x node width for comfortable spacing
layerSpacing: 200, // 4.0x node height for clear layer separation
edgeNodeSpacing: 40, // Clear edge-to-node clearance
edgeEdgeSpacing: 20, // Minimum edge-to-edge spacing
```

### For Compact Layouts:
```typescript
nodeSpacing: 100,    // 0.67x node width
layerSpacing: 120, // 2.4x node height  
edgeNodeSpacing: 25,
edgeEdgeSpacing: 15,
```

### For Spacious Layouts:
```typescript
nodeSpacing: 200,    // 1.33x node width
layerSpacing: 250, // 5.0x node height
edgeNodeSpacing: 50,
edgeEdgeSpacing: 25,
```

## Algorithm-Specific Considerations

### Layered (Sugiyama)
- **layerSpacing**: Critical for readability
- **nodeSpacing**: Important for complex branching
- **direction**: DOWN for traditional state machines, RIGHT for flowcharts

### Force/Stress
- **nodeSpacing**: Affects repulsion force
- **layerSpacing**: Maps to desired edge length
- **direction**: Less important, affects initial placement

### Tree (MRTree)
- **nodeSpacing**: Sibling spacing
- **layerSpacing**: Level spacing
- **direction**: DOWN for natural trees, RIGHT for horizontal trees

## Current Defaults Analysis

**Current ELK defaults:**
```typescript
nodeSpacing: 120,     // Good - ~0.8x standard node width
layerSpacing: 180,    // Good - ~3.6x standard node height  
edgeNodeSpacing: 30,  // Good - clear edge clearance
edgeEdgeSpacing: 15,  // Minimum - could be increased
```

**Assessment**: Current defaults are well-calculated for standard ReactFlow nodes and provide good visual spacing.
