# Edge Case Analysis

## Goal
Identify, analyze, and provide solutions for edge cases, infinite loops, performance issues, and problematic configurations in ReactFlow layout system.

## Edge Case Classification

### 1. Infinite Loop Scenarios
### 2. Performance Degradation Cases  
### 3. Visual Quality Failures
### 4. Memory and Resource Issues
### 5. User Experience Problems
### 6. Browser Compatibility Issues

## Infinite Loop Scenarios

### Scenario 1: Layered Algorithm + High Thoroughness
**Problem**: Layered algorithm with thoroughness > 15 causes infinite loops
**Affected Examples**: Traffic light, simple hierarchical graphs
**Root Cause**: ELK layered crossing minimization gets stuck in local minima

#### Technical Analysis
```typescript
// Problematic configuration
const problematicConfig = {
  algorithm: "layered",
  thoroughness: 18,  // Too high
  direction: "DOWN"
};

// ELK options that cause issues
const elkOptions = {
  "elk.layered.thoroughness": "18",  // Excessive iterations
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.crossingMinimization.semiInteractive": "true"
};
```

**Symptoms**:
- Layout computation never completes
- Browser becomes unresponsive
- Memory usage increases indefinitely
- No error thrown, just hangs

#### Solution Implementation
```typescript
// Fix: Add iteration limits and validation
const validateLayeredOptions = (options: LayoutOptions) => {
  return {
    ...options,
    thoroughness: Math.max(1, Math.min(15, options.thoroughness || 7)),
    // Add timeout protection
    "elk.layered.thoroughness": Math.min(15, options.thoroughness || 7).toString(),
    "elk.layered.crossingMinimization.maxIterations": "1000"
  };
};

// Add timeout wrapper
const layoutWithTimeout = async (graph: any, options: any, timeoutMs = 5000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Layout computation timeout')), timeoutMs);
  });
  
  const layoutPromise = elk.layout(graph);
  
  try {
    return await Promise.race([layoutPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Layout timeout, falling back to simple layout');
    return fallbackLayout(graph);
  }
};
```

### Scenario 2: Force Algorithm + Low Temperature
**Problem**: Force algorithm with thoroughness < 3 fails to converge
**Affected Examples**: Rock paper scissors, symmetric graphs
**Root Cause**: Temperature too low for force simulation to escape local minima

#### Technical Analysis
```typescript
// Problematic configuration
const problematicConfig = {
  algorithm: "force",
  thoroughness: 1,  // Too low
  nodeSpacing: 50  // Too tight
};

// ELK options that cause issues
const elkOptions = {
  "elk.force.temperature": "0.001",  // Too cold
  "elk.force.iterations": "300",
  "elk.force.repulsion": "5"  // Too weak
};
```

**Symptoms**:
- Nodes cluster in center
- No meaningful separation
- Poor graph structure
- Sometimes infinite oscillation

#### Solution Implementation
```typescript
// Fix: Minimum temperature and better force parameters
const validateForceOptions = (options: LayoutOptions) => {
  const minTemperature = 0.01;
  const temperature = Math.max(minTemperature, (options.thoroughness || 7) / 1000);
  
  return {
    ...options,
    "elk.force.temperature": temperature.toString(),
    "elk.force.iterations": "500",
    "elk.force.repulsion": Math.max(10, (options.nodeSpacing || 100) / 10).toString(),
    "elk.force.attraction": Math.max(0.001, (options.layerSpacing || 120) / 300).toString()
  };
};
```

### Scenario 3: Spore Overlap + Hierarchy Handling
**Problem**: SporeOverlap algorithm conflicts with ELK hierarchy handling
**Affected Examples**: HSM combobox, any hierarchical state machine
**Root Cause**: Overlap removal tries to flatten hierarchy while ELK tries to preserve it

#### Technical Analysis
```typescript
// Problematic configuration
const problematicConfig = {
  algorithm: "sporeOverlap",
  // Hierarchy handling enabled by default
  "elk.hierarchyHandling": "INCLUDE_CHILDREN"
};
```

**Symptoms**:
- Infinite loop in overlap detection
- Memory allocation failure
- Hierarchy corruption
- Complete layout failure

#### Solution Implementation
```typescript
// Fix: Disable hierarchy handling for sporeOverlap
const validateSporeOverlapOptions = (options: LayoutOptions) => {
  if (options.algorithm === "sporeOverlap") {
    return {
      ...options,
      "elk.hierarchyHandling": "NO",
      "elk.sporeOverlap.overlapRemovalStrategy": "SCAN_LINE",
      "elk.sporeOverlap.maxIterations": "100"
    };
  }
  return options;
};
```

### Scenario 4: Stress Algorithm + Component Separation
**Problem**: Stress algorithm with separateComponents creates disconnected subgraphs
**Affected Examples**: Async calculator, complex multi-component graphs
**Root Cause**: Stress optimization treats each component independently, losing global structure

#### Technical Analysis
```typescript
// Problematic configuration
const problematicConfig = {
  algorithm: "stress",
  separateComponents: true,
  "elk.stress.separateComponents": "true"
};
```

**Symptoms**:
- Components drift apart excessively
- Loss of meaningful relationships
- Poor use of screen space
- Sometimes infinite separation

#### Solution Implementation
```typescript
// Fix: Conservative component separation
const validateStressOptions = (options: LayoutOptions) => {
  if (options.algorithm === "stress" && options.separateComponents) {
    return {
      ...options,
      "elk.stress.separateComponents": "CONSERVATIVE",
      "elk.stress.componentSeparation.factor": "0.5",
      "elk.stress.maxComponentDistance": "500"
    };
  }
  return options;
};
```

## Performance Degradation Cases

### Case 1: Large Graph + High Thoroughness
**Problem**: Graphs with > 50 nodes + thoroughness > 10 cause severe slowdown
**Impact**: Layout computation > 10 seconds, browser freeze

#### Solution
```typescript
const performanceOptimization = (nodes: Node[], options: LayoutOptions) => {
  const nodeCount = nodes.length;
  
  // Adaptive thoroughness based on graph size
  let adaptiveThoroughness = options.thoroughness || 7;
  
  if (nodeCount > 50) {
    adaptiveThoroughness = Math.min(3, adaptiveThoroughness);
  } else if (nodeCount > 20) {
    adaptiveThoroughness = Math.min(7, adaptiveThoroughness);
  }
  
  // Force algorithm for large graphs
  let adaptiveAlgorithm = options.algorithm;
  if (nodeCount > 30 && options.algorithm !== "force") {
    adaptiveAlgorithm = "force";
  }
  
  return {
    ...options,
    algorithm: adaptiveAlgorithm,
    thoroughness: adaptiveThoroughness
  };
};
```

### Case 2: Complex Edges + Orthogonal Routing
**Problem**: Many edges + complex routing cause O(n²) complexity
**Impact**: Edge routing dominates computation time

#### Solution
```typescript
const edgeOptimization = (edges: Edge[], options: LayoutOptions) => {
  const edgeCount = edges.length;
  
  // Simplify edge routing for complex graphs
  if (edgeCount > 20) {
    return {
      ...options,
      "elk.layered.edgeRouting": "POLYLINE",  // Simpler than ORTHOGONAL
      "elk.edgeRouting": "POLYLINE"
    };
  }
  
  return options;
};
```

## Visual Quality Failures

### Failure 1: Node Overlap in Force Layouts
**Problem**: Force layouts can create node overlaps with insufficient repulsion
**Affected**: Dense graphs, small node spacing

#### Solution
```typescript
const preventNodeOverlap = (options: LayoutOptions, nodeCount: number) => {
  if (options.algorithm === "force") {
    // Scale repulsion based on node density
    const minRepulsion = Math.max(20, nodeCount * 2);
    const repulsion = Math.max(minRepulsion, (options.nodeSpacing || 100) / 5);
    
    return {
      ...options,
      "elk.force.repulsion": repulsion.toString(),
      "elk.force.useSmartRepulsion": "true"
    };
  }
  return options;
};
```

### Failure 2: Edge Crossings in Layered Layouts
**Problem**: Layered layouts can have excessive edge crossings
**Affected**: Complex non-tree graphs

#### Solution
```typescript
const minimizeEdgeCrossings = (options: LayoutOptions) => {
  if (options.algorithm === "layered") {
    return {
      ...options,
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.crossingMinimization.semiInteractive": "true",
      "elk.layered.crossingMinimization.maxIterations": "1000"
    };
  }
  return options;
};
```

### Failure 3: Poor Aspect Ratio
**Problem**: Layouts can be too wide or too tall
**Affected**: Linear graphs, extreme aspect ratios

#### Solution
```typescript
const optimizeAspectRatio = (nodes: Node[], options: LayoutOptions) => {
  // Estimate final aspect ratio based on graph structure
  const estimatedRatio = estimateAspectRatio(nodes);
  
  if (estimatedRatio > 3.0) {
    // Too wide, use vertical layout
    return { ...options, direction: "DOWN" };
  } else if (estimatedRatio < 0.33) {
    // Too tall, use horizontal layout
    return { ...options, direction: "RIGHT" };
  }
  
  return options;
};
```

## Memory and Resource Issues

### Issue 1: Memory Leaks in Repeated Layouts
**Problem**: Repeated layout computations leak memory
**Impact**: Browser becomes slow over time

#### Solution
```typescript
const memoryManagement = {
  // Clear layout cache periodically
  clearCache: () => {
    if (layoutCache.size > 100) {
      layoutCache.clear();
    }
  },
  
  // Force garbage collection hints
  cleanup: () => {
    // Clear temporary data structures
    temporaryNodes = [];
    temporaryEdges = [];
    
    // Hint to browser (not guaranteed)
    if (window.gc) {
      window.gc();
    }
  }
};
```

### Issue 2: Excessive DOM Creation
**Problem**: Creating too many DOM elements during layout
**Impact**: Slow rendering, high memory usage

#### Solution
```typescript
const domOptimization = {
  // Batch DOM updates
  batchUpdates: (updates: Function[]) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },
  
  // Reuse elements instead of recreating
  elementPool: new Map<string, HTMLElement[]>(),
  
  getElement: (type: string) => {
    const pool = elementPool.get(type) || [];
    return pool.pop() || document.createElement(type);
  },
  
  returnElement: (element: HTMLElement, type: string) => {
    const pool = elementPool.get(type) || [];
    pool.push(element);
    elementPool.set(type, pool);
  }
};
```

## User Experience Problems

### Problem 1: Layout Flicker During Updates
**Problem**: Visual flicker when layout changes
**Impact**: Jarring user experience

#### Solution
```typescript
const smoothLayoutTransition = {
  // Animate between layouts
  animateTransition: (oldNodes: Node[], newNodes: Node[], duration = 300) => {
    const transitions = oldNodes.map(oldNode => {
      const newNode = newNodes.find(n => n.id === oldNode.id);
      if (newNode) {
        return {
          element: document.querySelector(`[data-node-id="${oldNode.id}"]`),
          from: oldNode.position,
          to: newNode.position
        };
      }
    }).filter(Boolean);
    
    // Animate position changes
    transitions.forEach(transition => {
      const element = transition.element;
      if (element) {
        element.style.transition = `transform ${duration}ms ease`;
        element.style.transform = `translate(${transition.to.x}px, ${transition.to.y}px)`;
      }
    });
  }
};
```

### Problem 2: No Feedback During Long Layouts
**Problem**: Users don't know if layout is computing
**Impact**: Users think application is broken

#### Solution
```typescript
const layoutFeedback = {
  // Show progress indicator
  showProgress: (algorithm: string, estimatedTime: number) => {
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'layout-progress';
    progressIndicator.innerHTML = `
      <div class="spinner"></div>
      <div>Computing ${algorithm} layout...</div>
      <div class="progress-bar">
        <div class="progress-fill" style="animation: progress ${estimatedTime}ms linear"></div>
      </div>
    `;
    
    document.body.appendChild(progressIndicator);
    return progressIndicator;
  },
  
  hideProgress: (indicator: HTMLElement) => {
    indicator.remove();
  }
};
```

## Browser Compatibility Issues

### Issue 1: Safari Performance
**Problem**: Safari slower layout computation
**Impact**: Poor user experience on Safari

#### Solution
```typescript
const safariOptimizations = {
  // Detect Safari
  isSafari: () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  
  // Safari-specific optimizations
  optimizeForSafari: (options: LayoutOptions) => {
    if (safariOptimizations.isSafari()) {
      return {
        ...options,
        thoroughness: Math.min(5, options.thoroughness || 7),  // Lower quality
        "elk.layered.crossingMinimization.maxIterations": "500",  // Fewer iterations
        "elk.force.iterations": "200"  // Faster force simulation
      };
    }
    return options;
  }
};
```

### Issue 2: Mobile Touch Events
**Problem**: Layout panel controls too small for touch
**Impact**: Poor mobile usability

#### Solution
```css
/* Mobile-specific styles */
@media (max-width: 768px) {
  .layout-panel {
    font-size: 16px;  /* Prevent zoom */
  }
  
  .layout-panel input[type="range"] {
    height: 44px;  /* iOS touch target minimum */
    width: 100%;
  }
  
  .layout-panel select {
    padding: 12px;
    min-height: 44px;
  }
  
  .layout-panel button {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Comprehensive Edge Case Prevention

### Pre-Layout Validation
```typescript
const validateLayoutConfiguration = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check for known problematic combinations
  if (options.algorithm === "layered" && (options.thoroughness || 0) > 15) {
    issues.push({
      type: 'infinite_loop_risk',
      message: 'Layered algorithm with thoroughness > 15 may cause infinite loops',
      solution: 'Reduce thoroughness to ≤ 15'
    });
  }
  
  if (options.algorithm === "force" && (options.thoroughness || 0) < 3) {
    issues.push({
      type: 'convergence_failure',
      message: 'Force algorithm with thoroughness < 3 may not converge',
      solution: 'Increase thoroughness to ≥ 3'
    });
  }
  
  if (options.algorithm === "sporeOverlap" && nodes.some(n => n.parentId)) {
    issues.push({
      type: 'hierarchy_conflict',
      message: 'SporeOverlap conflicts with hierarchical nodes',
      solution: 'Use different algorithm or flatten hierarchy'
    });
  }
  
  // Performance warnings
  if (nodes.length > 50 && (options.thoroughness || 0) > 10) {
    warnings.push({
      type: 'performance_warning',
      message: 'Large graph with high thoroughness may be slow',
      solution: 'Consider reducing thoroughness or using force algorithm'
    });
  }
  
  // Visual quality warnings
  if (options.algorithm === "force" && (options.nodeSpacing || 0) < 50) {
    warnings.push({
      type: 'quality_warning',
      message: 'Force algorithm with low node spacing may cause overlaps',
      solution: 'Increase node spacing'
    });
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    recommendations: generateRecommendations(issues, warnings)
  };
};
```

### Runtime Monitoring
```typescript
const layoutMonitor = {
  // Monitor layout computation
  monitorLayout: async (
    computeLayout: () => Promise<LayoutResult>,
    options: LayoutOptions
  ): Promise<LayoutResult> => {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    
    try {
      const result = await computeLayout();
      
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Check for performance issues
      const computationTime = endTime - startTime;
      const memoryIncrease = endMemory - startMemory;
      
      if (computationTime > 5000) {
        console.warn('Slow layout detected:', {
          algorithm: options.algorithm,
          time: computationTime,
          recommendation: 'Consider reducing thoroughness or graph complexity'
        });
      }
      
      if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
        console.warn('High memory usage detected:', {
          algorithm: options.algorithm,
          memoryIncrease: memoryIncrease / 1024 / 1024,
          recommendation: 'Consider memory cleanup or simpler algorithm'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Layout computation failed:', error);
      throw error;
    }
  }
};
```

### Automatic Recovery
```typescript
const layoutRecovery = {
  // Attempt to recover from failed layouts
  attemptRecovery: async (
    nodes: Node[],
    edges: Edge[],
    originalOptions: LayoutOptions,
    error: Error
  ): Promise<LayoutResult> => {
    console.warn('Layout failed, attempting recovery:', error.message);
    
    // Recovery strategy 1: Reduce thoroughness
    if (originalOptions.thoroughness && originalOptions.thoroughness > 5) {
      const recoveryOptions = {
        ...originalOptions,
        thoroughness: Math.max(3, originalOptions.thoroughness / 2)
      };
      
      try {
        console.log('Recovery: Reducing thoroughness to', recoveryOptions.thoroughness);
        return await computeLayout(nodes, edges, recoveryOptions);
      } catch (recoveryError) {
        console.warn('Recovery strategy 1 failed:', recoveryError);
      }
    }
    
    // Recovery strategy 2: Switch to simpler algorithm
    const algorithmFallback = {
      'layered': 'mrtree',
      'stress': 'force',
      'force': 'mrtree',
      'sporeOverlap': 'layered'
    };
    
    const fallbackAlgorithm = algorithmFallback[originalOptions.algorithm];
    if (fallbackAlgorithm) {
      const recoveryOptions = {
        ...originalOptions,
        algorithm: fallbackAlgorithm,
        thoroughness: 3
      };
      
      try {
        console.log('Recovery: Switching to algorithm', fallbackAlgorithm);
        return await computeLayout(nodes, edges, recoveryOptions);
      } catch (recoveryError) {
        console.warn('Recovery strategy 2 failed:', recoveryError);
      }
    }
    
    // Recovery strategy 3: Simple grid layout
    console.log('Recovery: Using simple grid layout');
    return fallbackGridLayout(nodes, edges);
  }
};
```

## Testing Edge Cases

### Automated Edge Case Tests
```typescript
describe('Layout Edge Cases', () => {
  describe('Infinite Loop Prevention', () => {
    test('should prevent layered infinite loop with high thoroughness', async () => {
      const options = { algorithm: 'layered', thoroughness: 20 };
      const validation = validateLayoutConfiguration(testNodes, testEdges, options);
      
      expect(validation.valid).toBe(false);
      expect(validation.issues).toContainEqual(
        expect.objectContaining({ type: 'infinite_loop_risk' })
      );
    });
    
    test('should prevent force convergence failure with low thoroughness', async () => {
      const options = { algorithm: 'force', thoroughness: 1 };
      const validation = validateLayoutConfiguration(testNodes, testEdges, options);
      
      expect(validation.valid).toBe(false);
      expect(validation.issues).toContainEqual(
        expect.objectContaining({ type: 'convergence_failure' })
      );
    });
  });
  
  describe('Performance Edge Cases', () => {
    test('should handle large graphs without timeout', async () => {
      const largeNodes = generateNodes(100);
      const options = { algorithm: 'layered', thoroughness: 15 };
      
      const startTime = performance.now();
      const result = await computeLayoutWithTimeout(largeNodes, testEdges, options, 10000);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10000);
      expect(result.nodes).toHaveLength(100);
    });
  });
  
  describe('Visual Quality Edge Cases', () => {
    test('should prevent node overlaps in force layouts', async () => {
      const denseNodes = generateDenseNodes(20);
      const options = { algorithm: 'force', nodeSpacing: 30 };
      
      const validation = validateLayoutConfiguration(denseNodes, testEdges, options);
      
      expect(validation.warnings).toContainEqual(
        expect.objectContaining({ type: 'quality_warning' })
      );
    });
  });
});
```

### Stress Testing
```typescript
describe('Layout Stress Tests', () => {
  test('should handle rapid layout changes', async () => {
    const layoutPanel = render(<LayoutPanel />);
    
    // Rapidly change options
    for (let i = 0; i < 10; i++) {
      fireEvent.change(layoutPanel.getByLabelText('Node Spacing'), {
        target: { value: String(50 + i * 10) }
      });
    }
    
    // Should debounce and only compute once
    await waitFor(() => {
      expect(onOptionsChange).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });
  
  test('should recover from layout failures', async () => {
    const problematicOptions = { algorithm: 'layered', thoroughness: 25 };
    
    const result = await layoutRecovery.attemptRecovery(
      testNodes,
      testEdges,
      problematicOptions,
      new Error('Layout timeout')
    );
    
    expect(result.nodes).toBeDefined();
    expect(result.nodes.length).toBe(testNodes.length);
  });
});
```

## Documentation and User Guidance

### Error Messages for Users
```typescript
const userFriendlyErrors = {
  'infinite_loop_risk': 'This layout configuration may cause the browser to become unresponsive. Try reducing the quality setting or choosing a different algorithm.',
  'convergence_failure': 'The force layout cannot stabilize with these settings. Try increasing the quality setting or adjusting the spacing.',
  'hierarchy_conflict': 'This algorithm does not work well with hierarchical state machines. Try the Layered algorithm instead.',
  'performance_warning': 'This layout may be slow for large graphs. Consider reducing quality or using a simpler algorithm.',
  'quality_warning': 'These settings may cause visual issues like overlapping nodes. Try increasing the spacing.'
};
```

### User Guidance System
```typescript
const layoutGuidance = {
  // Provide contextual help
  getHelpForContext: (context: LayoutContext) => {
    const guidance = [];
    
    if (context.nodeCount > 30) {
      guidance.push({
        type: 'performance',
        message: 'For large graphs, consider using the Force algorithm or reducing quality.',
        priority: 'high'
      });
    }
    
    if (context.hasHierarchy && context.algorithm !== 'layered') {
      guidance.push({
        type: 'quality',
        message: 'Hierarchical graphs work best with the Layered algorithm.',
        priority: 'medium'
      });
    }
    
    return guidance;
  },
  
  // Suggest optimal configurations
  suggestOptimalConfig: (graphAnalysis: GraphAnalysis) => {
    if (graphAnalysis.isHierarchical) {
      return {
        algorithm: 'layered',
        direction: 'DOWN',
        thoroughness: 7,
        nodeSpacing: 100,
        layerSpacing: 120
      };
    }
    
    if (graphAnalysis.isSymmetric) {
      return {
        algorithm: 'force',
        thoroughness: 10,
        nodeSpacing: 120,
        layerSpacing: 150
      };
    }
    
    // Default balanced configuration
    return {
      algorithm: 'layered',
      direction: 'DOWN',
      thoroughness: 5,
      nodeSpacing: 80,
      layerSpacing: 100
    };
  }
};
```

---

**Next Steps:**
1. Implement validation system for all layout configurations
2. Add runtime monitoring and automatic recovery
3. Create comprehensive edge case test suite
4. Build user guidance and help system
5. Document all edge cases and solutions for development team
