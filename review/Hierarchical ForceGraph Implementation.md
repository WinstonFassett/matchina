# ForceGraph Hierarchical Implementation

## Goal
Implement robust hierarchical force-directed graph layout for ForceGraph visualizer that supports both HSMs and regular FSMs with interactive grouping and subflows.

## Current ForceGraph Architecture Analysis

### Existing Implementation
```typescript
ForceGraphInspector (main component)
├── HSMForceGraphInspector (HSM adapter)
├── buildForceGraphData (shape conversion)
└── force-graph library (3rd party)
```

### Current Capabilities
- **Basic force-directed layout** using force-graph library
- **HSM support** through shape conversion
- **Interactive nodes** with click-to-transition
- **State highlighting** for active states
- **Group node detection** for compound states
- **Hierarchy links** (parent-child relationships)

### Current Limitations
- **Limited hierarchical layout control**
- **No subflow grouping/interaction**
- **Basic force simulation** only
- **No layout customization**
- **Limited visual hierarchy**

## Hierarchical Force-Directed Layout Research

### Library Comparison

#### 1. force-graph (Current)
**Pros:**
- Already integrated
- Good performance
- Canvas-based rendering
- Interactive features built-in

**Cons:**
- Limited hierarchical control
- Basic force simulation only
- No advanced grouping features

#### 2. D3.js Force Simulation
**Pros:**
- Full control over force simulation
- Advanced hierarchical features
- Custom force functions
- Extensive documentation

**Cons:**
- Requires more implementation
- Steeper learning curve
- Performance considerations

#### 3. WebCola
**Pros:**
- Constraint-based layout
- Excellent for hierarchical graphs
- Stable and predictable
- Good group support

**Cons:**
- Smaller community
- Less actively maintained
- Canvas rendering limitations

#### 4. Custom Implementation
**Pros:**
- Full control over features
- Optimized for specific use case
- Can integrate best practices

**Cons:**
- Highest development effort
- Maintenance burden
- Performance optimization required

### Recommended Approach: Enhanced force-graph + D3.js Hybrid

**Strategy**: Keep force-graph as base but enhance with D3.js force simulation for hierarchical features.

## Implementation Architecture

### Enhanced ForceGraph Architecture
```typescript
HierarchicalForceGraphInspector
├── ForceSimulationManager (D3.js forces)
├── HierarchyRenderer (group visualization)
├── InteractionManager (subflow interactions)
├── LayoutOptimizer (hierarchical positioning)
└── ThemeManager (visual styling)
```

### Core Components

#### 1. ForceSimulationManager
```typescript
interface ForceSimulationConfig {
  // Basic forces
  linkStrength: number;
  nodeCharge: number;
  centerStrength: number;
  collisionRadius: number;
  
  // Hierarchical forces
  hierarchyStrength: number;
  groupAttraction: number;
  levelAlignment: number;
  
  // Layout constraints
  levelSpacing: number;
  groupPadding: number;
  aspectRatio: number;
}

class ForceSimulationManager {
  private simulation: d3.Simulation<any, any>;
  private forces: Map<string, d3.Force<any, any>>;
  
  constructor(config: ForceSimulationConfig) {
    this.setupSimulation(config);
  }
  
  // Enhanced force setup for hierarchical graphs
  private setupSimulation(config: ForceSimulationConfig) {
    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter())
      .force('collision', d3.forceCollide())
      .force('hierarchy', this.createHierarchyForce())
      .force('levelAlignment', this.createLevelAlignmentForce())
      .force('groupAttraction', this.createGroupAttractionForce());
  }
  
  // Custom hierarchy force to maintain parent-child relationships
  private createHierarchyForce(): d3.Force<any, any> {
    return (alpha: number) => {
      // Apply hierarchical constraints
      nodes.forEach(node => {
        if (node.parentId && node.parentId !== node.id) {
          const parent = nodes.find(n => n.id === node.parentId);
          if (parent) {
            // Keep child nodes near parent
            const dx = parent.x - node.x;
            const dy = parent.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const desiredDistance = this.getHierarchyDistance(node.level);
            
            if (distance > desiredDistance) {
              node.vx += dx * alpha * 0.1;
              node.vy += dy * alpha * 0.1;
            }
          }
        }
      });
    };
  }
  
  // Level alignment force for better hierarchy visualization
  private createLevelAlignmentForce(): d3.Force<any, any> {
    return (alpha: number) => {
      // Group nodes by level
      const nodesByLevel = d3.group(nodes, d => d.level);
      
      nodesByLevel.forEach((levelNodes, level) => {
        // Calculate average Y position for this level
        const avgY = d3.mean(levelNodes, d => d.y);
        const targetY = level * this.config.levelSpacing;
        
        levelNodes.forEach(node => {
          // Apply gentle force toward level position
          const dy = targetY - node.y;
          node.vy += dy * alpha * 0.05;
        });
      });
    };
  }
  
  // Group attraction force for compound states
  private createGroupAttractionForce(): d3.Force<any, any> {
    return (alpha: number) => {
      // Group nodes by parent
      const nodesByGroup = d3.group(nodes, d => d.group);
      
      nodesByGroup.forEach((groupNodes, groupId) => {
        if (!groupId) return; // Skip root level nodes
        
        // Calculate group center
        const centerX = d3.mean(groupNodes, d => d.x);
        const centerY = d3.mean(groupNodes, d => d.y);
        
        groupNodes.forEach(node => {
          // Apply gentle force toward group center
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * alpha * 0.02;
          node.vy += dy * alpha * 0.02;
        });
      });
    };
  }
}
```

#### 2. HierarchyRenderer
```typescript
interface HierarchyRenderConfig {
  showGroupNodes: boolean;
  groupOpacity: number;
  levelColors: string[];
  showHierarchyLinks: boolean;
  collapseGroups: boolean;
}

class HierarchyRenderer {
  constructor(private config: HierarchyRenderConfig) {}
  
  // Enhanced node rendering with hierarchy support
  renderNode(node: ForceGraphNode, ctx: CanvasRenderingContext2D) {
    if (node.isGroup && this.config.showGroupNodes) {
      this.renderGroupNode(node, ctx);
    } else {
      this.renderStateNode(node, ctx);
    }
    
    // Render hierarchy indicators
    if (this.config.showHierarchyLinks && node.parentId) {
      this.renderHierarchyLink(node, ctx);
    }
  }
  
  // Render compound state as group
  private renderGroupNode(node: ForceGraphNode, ctx: CanvasRenderingContext2D) {
    const groupPadding = 20;
    const groupWidth = node.width || 200;
    const groupHeight = node.height || 100;
    
    // Draw group background
    ctx.fillStyle = this.getGroupColor(node.level);
    ctx.strokeStyle = this.getGroupBorderColor(node.level);
    ctx.lineWidth = 2;
    
    // Rounded rectangle for group
    this.roundRect(
      ctx,
      node.x - groupWidth / 2,
      node.y - groupHeight / 2,
      groupWidth,
      groupHeight,
      10
    );
    ctx.fill();
    ctx.stroke();
    
    // Draw group label
    ctx.fillStyle = this.getGroupTextColor(node.level);
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.name, node.x, node.y - groupHeight / 2 + 20);
  }
  
  // Render regular state node
  private renderStateNode(node: ForceGraphNode, ctx: CanvasRenderingContext2D) {
    const nodeSize = this.getNodeSize(node);
    
    // Node styling based on state
    ctx.fillStyle = this.getNodeColor(node);
    ctx.strokeStyle = this.getNodeBorderColor(node);
    ctx.lineWidth = node.isActive ? 3 : 1;
    
    // Draw node
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = this.getTextColor(node);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.name, node.x, node.y);
  }
  
  // Render hierarchy connection lines
  private renderHierarchyLink(node: ForceGraphNode, ctx: CanvasRenderingContext2D) {
    const parent = nodes.find(n => n.id === node.parentId);
    if (!parent) return;
    
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(parent.x, parent.y);
    ctx.lineTo(node.x, node.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }
}
```

#### 3. InteractionManager
```typescript
interface InteractionConfig {
  enableGroupCollapse: boolean;
  enableSubflowNavigation: boolean;
  enableDragAndDrop: boolean;
  enableZoomToGroup: boolean;
}

class InteractionManager {
  constructor(private config: InteractionConfig) {}
  
  // Handle node clicks with hierarchy support
  handleNodeClick(node: ForceGraphNode, event: MouseEvent) {
    if (node.isGroup && this.config.enableGroupCollapse) {
      this.toggleGroupCollapse(node);
    } else if (node.isGroup && this.config.enableSubflowNavigation) {
      this.navigateToSubflow(node);
    } else {
      this.triggerStateTransition(node);
    }
  }
  
  // Toggle group collapse state
  private toggleGroupCollapse(groupNode: ForceGraphNode) {
    groupNode.collapsed = !groupNode.collapsed;
    
    // Hide/show child nodes
    const childNodes = nodes.filter(n => n.parentId === groupNode.id);
    childNodes.forEach(child => {
      child.visible = !groupNode.collapsed;
    });
    
    // Restart simulation with new visibility
    this.restartSimulation();
  }
  
  // Navigate to subflow (zoom to group)
  private navigateToSubflow(groupNode: ForceGraphNode) {
    if (!this.config.enableZoomToGroup) return;
    
    // Calculate group bounds
    const childNodes = nodes.filter(n => n.parentId === groupNode.id);
    const bounds = this.calculateGroupBounds(groupNode, childNodes);
    
    // Zoom to group bounds
    this.zoomToBounds(bounds);
  }
  
  // Enhanced drag and drop with hierarchy constraints
  handleNodeDrag(node: ForceGraphNode, position: { x: number, y: number }) {
    // Apply hierarchy constraints
    if (node.parentId && !this.config.enableDragAndDrop) {
      // Limit movement within parent group
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent) {
        const maxDistance = this.getMaxChildDistance(parent);
        const distance = this.calculateDistance(position, parent);
        
        if (distance > maxDistance) {
          // Constrain position
          const angle = Math.atan2(
            position.y - parent.y,
            position.x - parent.x
          );
          position.x = parent.x + Math.cos(angle) * maxDistance;
          position.y = parent.y + Math.sin(angle) * maxDistance;
        }
      }
    }
    
    // Update node position
    node.x = position.x;
    node.y = position.y;
    node.fx = position.x; // Fix position during drag
    node.fy = position.y;
  }
}
```

#### 4. LayoutOptimizer
```typescript
interface LayoutConfig {
  algorithm: 'force' | 'hierarchical' | 'hybrid';
  levelSpacing: number;
  nodeSpacing: number;
  groupPadding: number;
  aspectRatio: number;
}

class LayoutOptimizer {
  constructor(private config: LayoutConfig) {}
  
  // Optimize initial positions for better hierarchical layout
  optimizeInitialPositions(nodes: ForceGraphNode[], links: ForceGraphLink[]) {
    switch (this.config.algorithm) {
      case 'hierarchical':
        return this.hierarchicalLayout(nodes, links);
      case 'force':
        return this.forceLayout(nodes, links);
      case 'hybrid':
        return this.hybridLayout(nodes, links);
    }
  }
  
  // Pure hierarchical layout
  private hierarchicalLayout(nodes: ForceGraphNode[], links: ForceGraphLink[]) {
    // Group nodes by level
    const nodesByLevel = d3.group(nodes, d => d.level);
    
    // Position nodes by level
    let currentY = 0;
    nodesByLevel.forEach((levelNodes, level) => {
      const levelWidth = levelNodes.length * this.config.nodeSpacing;
      const startX = -levelWidth / 2;
      
      levelNodes.forEach((node, index) => {
        node.x = startX + index * this.config.nodeSpacing;
        node.y = currentY;
        node.fx = node.x; // Fix position for hierarchical layout
        node.fy = node.y;
      });
      
      currentY += this.config.levelSpacing;
    });
    
    return nodes;
  }
  
  // Force layout with hierarchical constraints
  private forceLayout(nodes: ForceGraphNode[], links: ForceGraphLink[]) {
    // Start with random positions
    nodes.forEach(node => {
      node.x = Math.random() * 800 - 400;
      node.y = Math.random() * 600 - 300;
    });
    
    return nodes;
  }
  
  // Hybrid: start hierarchical, then apply forces
  private hybridLayout(nodes: ForceGraphNode[], links: ForceGraphLink[]) {
    // Start with hierarchical positions
    const hierarchicalNodes = this.hierarchicalLayout(nodes, links);
    
    // Release fixed positions for force simulation
    hierarchicalNodes.forEach(node => {
      node.fx = undefined;
      node.fy = undefined;
    });
    
    return hierarchicalNodes;
  }
  
  // Optimize group layout
  optimizeGroupLayout(nodes: ForceGraphNode[]) {
    const groups = d3.group(nodes, d => d.group);
    
    groups.forEach((groupNodes, groupId) => {
      if (!groupId) return; // Skip root level
      
      // Calculate group bounds
      const bounds = this.calculateGroupBounds(groupNodes);
      
      // Optimize internal layout
      this.optimizeGroupInternalLayout(groupNodes, bounds);
    });
  }
}
```

## Enhanced Data Structure

### Hierarchical Force Graph Node
```typescript
interface HierarchicalForceGraphNode extends ForceGraphNode {
  // Hierarchy properties
  parentId?: string;
  children: string[];
  level: number;
  depth: number;
  
  // Group properties
  isGroup: boolean;
  groupBounds?: { x: number; y: number; width: number; height: number };
  collapsed: boolean;
  visible: boolean;
  
  // Layout properties
  fx?: number; // Fixed x position
  fy?: number; // Fixed y position
  vx?: number; // Velocity x
  vy?: number; // Velocity y
  
  // Visual properties
  color?: string;
  size?: number;
  opacity?: number;
  
  // Interaction properties
  draggable: boolean;
  clickable: boolean;
  hoverable: boolean;
}
```

### Hierarchical Force Graph Link
```typescript
interface HierarchicalForceGraphLink extends ForceGraphLink {
  // Enhanced link properties
  strength: number;
  distance?: number;
  
  // Visual properties
  color?: string;
  width?: number;
  opacity?: number;
  type: 'transition' | 'hierarchy' | 'group';
  
  // Interaction properties
  clickable: boolean;
  hoverable: boolean;
  animated?: boolean;
}
```

## Implementation Strategy

### Phase 1: Enhanced Force Simulation
1. **Integrate D3.js force simulation** alongside force-graph
2. **Add hierarchical forces** for parent-child relationships
3. **Implement level alignment** for better hierarchy visualization
4. **Add group attraction** forces for compound states

### Phase 2: Hierarchy Visualization
1. **Enhanced node rendering** with group node support
2. **Hierarchy link rendering** for parent-child relationships
3. **Level-based coloring** and styling
4. **Group collapse/expand** functionality

### Phase 3: Interactive Features
1. **Group navigation** (zoom to subflow)
2. **Enhanced drag and drop** with hierarchy constraints
3. **Subflow exploration** with breadcrumb navigation
4. **Contextual interactions** based on node type

### Phase 4: Layout Optimization
1. **Hybrid layout algorithms** (hierarchical + force)
2. **Automatic layout selection** based on graph structure
3. **Performance optimization** for large graphs
4. **Quality metrics** and automatic tuning

## Integration with Existing System

### Adapter Pattern
```typescript
class HierarchicalForceGraphAdapter {
  private forceManager: ForceSimulationManager;
  private hierarchyRenderer: HierarchyRenderer;
  private interactionManager: InteractionManager;
  private layoutOptimizer: LayoutOptimizer;
  
  constructor(config: HierarchicalForceGraphConfig) {
    this.forceManager = new ForceSimulationManager(config.force);
    this.hierarchyRenderer = new HierarchyRenderer(config.rendering);
    this.interactionManager = new InteractionManager(config.interaction);
    this.layoutOptimizer = new LayoutOptimizer(config.layout);
  }
  
  // Convert existing ForceGraph data to hierarchical format
  adaptData(graphData: ForceGraphData): HierarchicalForceGraphData {
    return {
      nodes: graphData.nodes.map(this.enhanceNode),
      links: graphData.links.map(this.enhanceLink),
      hierarchy: this.buildHierarchy(graphData)
    };
  }
  
  // Enhance node with hierarchical properties
  private enhanceNode(node: ForceGraphNode): HierarchicalForceGraphNode {
    return {
      ...node,
      children: [],
      level: node.level || 0,
      collapsed: false,
      visible: true,
      draggable: true,
      clickable: true,
      hoverable: true
    };
  }
  
  // Enhance link with hierarchical properties
  private enhanceLink(link: ForceGraphLink): HierarchicalForceGraphLink {
    return {
      ...link,
      strength: link.type === 'hierarchy' ? 0.5 : 1.0,
      clickable: link.type === 'transition',
      hoverable: true,
      animated: link.type === 'transition'
    };
  }
}
```

### Backward Compatibility
```typescript
// Maintain existing ForceGraphInspector interface
export default function EnhancedForceGraphInspector(props: ForceGraphInspectorProps) {
  const adapter = useMemo(() => new HierarchicalForceGraphAdapter(config), []);
  
  // Convert existing data
  const hierarchicalData = useMemo(() => {
    const baseData = buildForceGraphData(shape, { showHierarchy: true });
    return adapter.adaptData(baseData);
  }, [shape]);
  
  // Use enhanced implementation
  return (
    <HierarchicalForceGraphComponent
      data={hierarchicalData}
      onInteraction={handleInteraction}
      theme={theme}
    />
  );
}
```

## Performance Considerations

### Optimization Strategies
1. **Level-of-detail rendering** for large graphs
2. **Spatial indexing** for efficient collision detection
3. **Progressive enhancement** for complex layouts
4. **Web Workers** for force simulation computation

### Memory Management
1. **Node pooling** for frequent updates
2. **Link caching** for performance
3. **Garbage collection hints** for large graphs
4. **Lazy loading** for subflows

### Rendering Optimization
1. **Canvas batching** for better performance
2. **Dirty region rendering** for partial updates
3. **Level-based culling** for off-screen nodes
4. **Animation frame optimization**

## Testing Strategy

### Unit Tests
```typescript
describe('HierarchicalForceGraph', () => {
  test('should maintain parent-child relationships', () => {
    const graphData = createHierarchicalTestData();
    const result = adapter.adaptData(graphData);
    
    expect(result.nodes.filter(n => n.parentId)).toHaveLength(3);
    expect(result.nodes.filter(n => n.isGroup)).toHaveLength(2);
  });
  
  test('should optimize layout for hierarchical graphs', () => {
    const nodes = createTestNodes();
    const optimized = layoutOptimizer.optimizeInitialPositions(nodes, []);
    
    expect(optimized[0].y).toBeLessThan(optimized[1].y);
  });
});
```

### Visual Tests
```typescript
describe('HierarchicalForceGraph Visual Tests', () => {
  test('should render hierarchy correctly', async () => {
    await expect(page).toHaveScreenshot('hierarchy-basic.png');
  });
  
  test('should handle group collapse', async () => {
    await page.click('[data-node-id="group1"]');
    await expect(page).toHaveScreenshot('hierarchy-collapsed.png');
  });
});
```

### Performance Tests
```typescript
describe('HierarchicalForceGraph Performance', () => {
  test('should handle 100 nodes within 2 seconds', async () => {
    const startTime = performance.now();
    const graphData = createLargeGraphData(100);
    await renderGraph(graphData);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(2000);
  });
});
```

---

**Next Steps:**
1. Implement ForceSimulationManager with D3.js integration
2. Create HierarchyRenderer with enhanced node visualization
3. Build InteractionManager with group navigation
4. Develop LayoutOptimizer with hybrid algorithms
5. Integrate with existing ForceGraphInspector
6. Add comprehensive testing suite
7. Document usage patterns and best practices
