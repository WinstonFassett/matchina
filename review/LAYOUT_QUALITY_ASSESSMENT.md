# Layout Quality Assessment

## Goal
Establish comprehensive metrics and evaluation framework for assessing layout quality, readability, and user experience across all examples and configurations.

## Quality Assessment Framework

### Multi-Dimensional Quality Model

Layout quality is assessed across 6 key dimensions:

1. **Readability** - How easily users can understand the graph
2. **Aesthetics** - Visual appeal and professional appearance  
3. **Performance** - Computational efficiency and responsiveness
4. **Stability** - Consistency across runs and minor changes
5. **Accessibility** - Usability for users with disabilities
6. **Adaptability** - How well it adapts to different contexts

### Measurement Methodology

#### Quantitative Metrics (Automated)
- Node overlap count
- Edge crossing count
- Edge length variance
- Aspect ratio optimization
- Area utilization efficiency
- Hierarchical clarity score

#### Qualitative Metrics (Human Assessment)
- Visual flow comprehension
- State relationship clarity
- Overall aesthetic appeal
- User confidence in understanding
- Professional appearance
- Context appropriateness

## Detailed Quality Metrics

### 1. Readability Metrics

#### Node Overlap Score
```typescript
interface NodeOverlapMetric {
  overlappingNodes: number;        // Count of overlapping node pairs
  totalOverlapArea: number;        // Total area of overlap
  maxOverlapDepth: number;         // Maximum nodes overlapping at same point
  overlapScore: number;            // Normalized score (0 = no overlap, 1 = severe)
}

const calculateNodeOverlap = (nodes: Node[]): NodeOverlapMetric => {
  let overlappingPairs = 0;
  let totalOverlapArea = 0;
  let maxDepth = 0;
  
  // Check all node pairs for overlap
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const overlap = calculateNodePairOverlap(nodes[i], nodes[j]);
      if (overlap.area > 0) {
        overlappingPairs++;
        totalOverlapArea += overlap.area;
        maxDepth = Math.max(maxDepth, overlap.depth);
      }
    }
  }
  
  const overlapScore = Math.min(1, totalOverlapArea / (nodes.length * 1000));
  
  return {
    overlappingNodes: overlappingPairs,
    totalOverlapArea,
    maxOverlapDepth,
    overlapScore
  };
};
```

#### Edge Crossing Score
```typescript
interface EdgeCrossingMetric {
  crossingCount: number;           // Total edge crossings
  crossingPerEdge: number;         // Average crossings per edge
  criticalCrossings: number;       // Crossings near nodes
  crossingScore: number;            // Normalized score (0 = no crossings)
}

const calculateEdgeCrossings = (edges: Edge[]): EdgeCrossingMetric => {
  let crossingCount = 0;
  let criticalCrossings = 0;
  
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const crossing = calculateEdgePairCrossing(edges[i], edges[j]);
      if (crossing.exists) {
        crossingCount++;
        if (crossing.nearNode) {
          criticalCrossings++;
        }
      }
    }
  }
  
  const maxPossibleCrossings = (edges.length * (edges.length - 1)) / 2;
  const crossingScore = crossingCount / Math.max(1, maxPossibleCrossings);
  
  return {
    crossingCount,
    crossingPerEdge: crossingCount / Math.max(1, edges.length),
    criticalCrossings,
    crossingScore
  };
};
```

#### Hierarchical Clarity Score
```typescript
interface HierarchicalClarityMetric {
  levelAlignment: number;          // How well nodes align to levels
  parentChildAlignment: number;    // Parent-child relationship clarity
  levelConsistency: number;        // Consistent spacing between levels
  hierarchyScore: number;           // Overall hierarchical clarity
}

const calculateHierarchicalClarity = (nodes: Node[], edges: Edge[]): HierarchicalClarityMetric => {
  // Extract hierarchy levels
  const levels = extractHierarchyLevels(nodes, edges);
  
  // Calculate level alignment (Y-coordinate consistency within levels)
  let levelAlignment = 0;
  for (const [level, levelNodes] of levels) {
    const yVariance = calculateVariance(levelNodes.map(n => n.position.y));
    levelAlignment += 1 / (1 + yVariance);
  }
  levelAlignment /= levels.size;
  
  // Calculate parent-child alignment
  let parentChildAlignment = 0;
  let parentChildPairs = 0;
  
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    
    if (source && target) {
      const alignment = calculateParentChildAlignment(source, target);
      parentChildAlignment += alignment;
      parentChildPairs++;
    }
  }
  
  parentChildAlignment /= Math.max(1, parentChildPairs);
  
  // Calculate level consistency
  const levelSpacings = calculateLevelSpacings(levels);
  const levelConsistency = 1 / (1 + calculateVariance(levelSpacings));
  
  const hierarchyScore = (levelAlignment + parentChildAlignment + levelConsistency) / 3;
  
  return {
    levelAlignment,
    parentChildAlignment,
    levelConsistency,
    hierarchyScore
  };
};
```

### 2. Aesthetic Metrics

#### Aspect Ratio Score
```typescript
interface AspectRatioMetric {
  currentRatio: number;           // Current width/height ratio
  optimalRatio: number;           // Target ratio (typically 1.6-2.0)
  ratioDeviation: number;         // Deviation from optimal
  aspectScore: number;             // Normalized score (0-1)
}

const calculateAspectRatioScore = (nodes: Node[]): AspectRatioMetric => {
  const bounds = calculateBoundingRect(nodes);
  const currentRatio = bounds.width / Math.max(1, bounds.height);
  const optimalRatio = 1.8; // Golden ratio approximation
  
  const ratioDeviation = Math.abs(currentRatio - optimalRatio) / optimalRatio;
  const aspectScore = Math.max(0, 1 - ratioDeviation);
  
  return {
    currentRatio,
    optimalRatio,
    ratioDeviation,
    aspectScore
  };
};
```

#### Edge Length Uniformity
```typescript
interface EdgeUniformityMetric {
  averageLength: number;           // Mean edge length
  lengthVariance: number;         // Variance in edge lengths
  lengthRange: number;             // Min-max range
  uniformityScore: number;        // Uniformity (0 = varied, 1 = uniform)
}

const calculateEdgeUniformity = (edges: Edge[]): EdgeUniformityMetric => {
  const edgeLengths = edges.map(edge => calculateEdgeLength(edge));
  
  const averageLength = edgeLengths.reduce((a, b) => a + b, 0) / edgeLengths.length;
  const lengthVariance = calculateVariance(edgeLengths);
  const lengthRange = Math.max(...edgeLengths) - Math.min(...edgeLengths);
  
  // Normalize variance to 0-1 scale (lower variance = higher score)
  const maxExpectedVariance = averageLength * averageLength; // Rough upper bound
  const uniformityScore = Math.max(0, 1 - (lengthVariance / maxExpectedVariance));
  
  return {
    averageLength,
    lengthVariance,
    lengthRange,
    uniformityScore
  };
};
```

#### Symmetry Score
```typescript
interface SymmetryMetric {
  horizontalSymmetry: number;     // Left-right symmetry
  verticalSymmetry: number;       // Top-bottom symmetry
  rotationalSymmetry: number;     // Rotational symmetry
  overallSymmetry: number;        // Combined symmetry score
}

const calculateSymmetry = (nodes: Node[]): SymmetryMetric => {
  const center = calculateGraphCenter(nodes);
  
  // Calculate horizontal symmetry
  const horizontalSymmetry = calculateReflectionSymmetry(nodes, center, 'horizontal');
  
  // Calculate vertical symmetry  
  const verticalSymmetry = calculateReflectionSymmetry(nodes, center, 'vertical');
  
  // Calculate rotational symmetry (90°, 180°, 270°)
  const rotationalSymmetry = calculateRotationalSymmetry(nodes, center);
  
  const overallSymmetry = (horizontalSymmetry + verticalSymmetry + rotationalSymmetry) / 3;
  
  return {
    horizontalSymmetry,
    verticalSymmetry,
    rotationalSymmetry,
    overallSymmetry
  };
};
```

### 3. Performance Metrics

#### Computation Time Score
```typescript
interface PerformanceMetric {
  layoutTime: number;              // Time to compute layout (ms)
  renderTime: number;              // Time to render (ms)
  totalTime: number;               // Total time (ms)
  memoryUsage: number;             // Memory used (MB)
  performanceScore: number;        // Performance score (0-1)
}

const calculatePerformanceScore = (metrics: {
  layoutTime: number;
  renderTime: number;
  memoryUsage: number;
}): PerformanceMetric => {
  const { layoutTime, renderTime, memoryUsage } = metrics;
  const totalTime = layoutTime + renderTime;
  
  // Performance targets (adjust based on requirements)
  const targetLayoutTime = 500;    // 500ms max for layout
  const targetRenderTime = 100;    // 100ms max for render
  const targetMemoryUsage = 50;    // 50MB max memory
  
  // Calculate individual scores
  const layoutScore = Math.max(0, 1 - (layoutTime / targetLayoutTime));
  const renderScore = Math.max(0, 1 - (renderTime / targetRenderTime));
  const memoryScore = Math.max(0, 1 - (memoryUsage / targetMemoryUsage));
  
  // Weighted average (layout is most important)
  const performanceScore = (layoutScore * 0.5 + renderScore * 0.3 + memoryScore * 0.2);
  
  return {
    layoutTime,
    renderTime,
    totalTime,
    memoryUsage,
    performanceScore
  };
};
```

### 4. Stability Metrics

#### Layout Consistency Score
```typescript
interface StabilityMetric {
  positionVariance: number;        // Variance in node positions across runs
  layoutDifference: number;       // Structural difference between runs
  convergenceStability: number;   // How stable the convergence is
  stabilityScore: number;          // Overall stability (0-1)
}

const calculateStability = (layouts: Node[][]): StabilityMetric => {
  if (layouts.length < 2) {
    return { positionVariance: 0, layoutDifference: 0, convergenceStability: 1, stabilityScore: 1 };
  }
  
  // Calculate position variance across runs
  const positionVariances = calculatePositionVariances(layouts);
  const avgPositionVariance = positionVariances.reduce((a, b) => a + b, 0) / positionVariances.length;
  
  // Calculate structural differences
  const layoutDifferences = [];
  for (let i = 1; i < layouts.length; i++) {
    const diff = calculateLayoutDifference(layouts[0], layouts[i]);
    layoutDifferences.push(diff);
  }
  const avgLayoutDifference = layoutDifferences.reduce((a, b) => a + b, 0) / layoutDifferences.length;
  
  // Calculate convergence stability (for force-based algorithms)
  const convergenceStability = calculateConvergenceStability(layouts);
  
  // Overall stability score
  const stabilityScore = Math.max(0, 1 - (avgPositionVariance / 1000) - (avgLayoutDifference / 100));
  
  return {
    positionVariance: avgPositionVariance,
    layoutDifference: avgLayoutDifference,
    convergenceStability,
    stabilityScore
  };
};
```

### 5. Accessibility Metrics

#### Contrast Compliance Score
```typescript
interface AccessibilityMetric {
  textContrastRatio: number;      // Minimum text contrast ratio
  uiContrastRatio: number;        // Minimum UI element contrast
  colorblindSafety: number;       // Colorblind-friendly score
  accessibilityScore: number;       // Overall accessibility (0-1)
}

const calculateAccessibility = (renderedLayout: HTMLElement): AccessibilityMetric => {
  // Check text contrast ratios
  const textElements = renderedLayout.querySelectorAll('text, .node-label');
  const textContrasts = Array.from(textElements).map(el => calculateContrastRatio(el));
  const textContrastRatio = Math.min(...textContrasts);
  
  // Check UI element contrast
  const uiElements = renderedLayout.querySelectorAll('.node, .edge');
  const uiContrasts = Array.from(uiElements).map(el => calculateContrastRatio(el));
  const uiContrastRatio = Math.min(...uiContrasts);
  
  // Check colorblind safety
  const colorblindSafety = checkColorblindSafety(renderedLayout);
  
  // WCAG AA compliance: 4.5:1 for normal text, 3:1 for large text
  const textCompliant = textContrastRatio >= 4.5;
  const uiCompliant = uiContrastRatio >= 3.0;
  
  const accessibilityScore = (
    (textCompliant ? 0.4 : 0) +
    (uiCompliant ? 0.3 : 0) +
    (colorblindSafety * 0.3)
  );
  
  return {
    textContrastRatio,
    uiContrastRatio,
    colorblindSafety,
    accessibilityScore
  };
};
```

### 6. Adaptability Metrics

#### Context Adaptation Score
```typescript
interface AdaptabilityMetric {
  screenAdaptation: number;       // How well it adapts to screen size
  themeAdaptation: number;        // How well it adapts to themes
  interactionAdaptation: number;   // How well it adapts to interaction
  adaptabilityScore: number;       // Overall adaptability (0-1)
}

const calculateAdaptability = (layoutTests: {
  screenSizes: string[];
  themes: string[];
  interactionModes: string[];
}): AdaptabilityMetric => {
  // Test screen size adaptation
  const screenScores = layoutTests.screenSizes.map(size => 
    testScreenAdaptation(layoutTests, size)
  );
  const screenAdaptation = screenScores.reduce((a, b) => a + b, 0) / screenScores.length;
  
  // Test theme adaptation
  const themeScores = layoutTests.themes.map(theme =>
    testThemeAdaptation(layoutTests, theme)
  );
  const themeAdaptation = themeScores.reduce((a, b) => a + b, 0) / themeScores.length;
  
  // Test interaction adaptation
  const interactionScores = layoutTests.interactionModes.map(mode =>
    testInteractionAdaptation(layoutTests, mode)
  );
  const interactionAdaptation = interactionScores.reduce((a, b) => a + b, 0) / interactionScores.length;
  
  const adaptabilityScore = (screenAdaptation + themeAdaptation + interactionAdaptation) / 3;
  
  return {
    screenAdaptation,
    themeAdaptation,
    interactionAdaptation,
    adaptabilityScore
  };
};
```

## Quality Scoring System

### Composite Quality Score
```typescript
interface OverallQualityScore {
  readability: number;            // 0-1
  aesthetics: number;             // 0-1
  performance: number;            // 0-1
  stability: number;              // 0-1
  accessibility: number;          // 0-1
  adaptability: number;           // 0-1
  overallScore: number;           // Weighted overall score
  grade: 'A' | 'B' | 'C' | 'D' | 'F'; // Letter grade
}

const calculateOverallQuality = (metrics: {
  readability: number;
  aesthetics: number;
  performance: number;
  stability: number;
  accessibility: number;
  adaptability: number;
}): OverallQualityScore => {
  // Weight different dimensions based on importance
  const weights = {
    readability: 0.25,      // Most important for understanding
    aesthetics: 0.15,       // Important for professional appearance
    performance: 0.20,      // Important for user experience
    stability: 0.15,        // Important for consistency
    accessibility: 0.15,    // Important for inclusivity
    adaptability: 0.10      // Important for flexibility
  };
  
  const overallScore = Object.entries(metrics).reduce((score, [key, value]) => {
    return score + (value * weights[key as keyof typeof weights]);
  }, 0);
  
  // Convert to letter grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overallScore >= 0.9) grade = 'A';
  else if (overallScore >= 0.8) grade = 'B';
  else if (overallScore >= 0.7) grade = 'C';
  else if (overallScore >= 0.6) grade = 'D';
  else grade = 'F';
  
  return {
    ...metrics,
    overallScore,
    grade
  };
};
```

### Quality Thresholds

#### Excellence Standards (Grade A)
- **Readability**: ≥ 0.9 (no overlaps, minimal crossings)
- **Aesthetics**: ≥ 0.85 (good proportions, symmetry)
- **Performance**: ≥ 0.8 (fast computation, smooth rendering)
- **Stability**: ≥ 0.85 (consistent across runs)
- **Accessibility**: ≥ 0.9 (WCAG AA compliant)
- **Adaptability**: ≥ 0.8 (works across contexts)

#### Acceptable Standards (Grade B-C)
- **Readability**: ≥ 0.7 (minor issues, still understandable)
- **Aesthetics**: ≥ 0.6 (decent appearance, some issues)
- **Performance**: ≥ 0.6 (acceptable speed, minor delays)
- **Stability**: ≥ 0.6 (mostly consistent, some variation)
- **Accessibility**: ≥ 0.6 (mostly accessible, some issues)
- **Adaptability**: ≥ 0.5 (works in primary contexts)

#### Unacceptable Standards (Grade D-F)
- Any dimension below 0.5
- Multiple dimensions below 0.6
- Critical accessibility failures
- Performance issues (> 2s computation)
- Major readability problems

## Automated Quality Testing

### Continuous Quality Monitoring
```typescript
class LayoutQualityMonitor {
  private qualityHistory: QualityRecord[] = [];
  
  async assessLayout(
    nodes: Node[], 
    edges: Edge[], 
    context: LayoutContext
  ): Promise<OverallQualityScore> {
    // Calculate all metrics
    const readability = await this.assessReadability(nodes, edges);
    const aesthetics = await this.assessAesthetics(nodes, edges);
    const performance = await this.assessPerformance(nodes, edges, context);
    const stability = await this.assessStability(nodes, edges);
    const accessibility = await this.assessAccessibility(nodes, edges);
    const adaptability = await this.assessAdaptability(nodes, edges, context);
    
    const quality = calculateOverallQuality({
      readability,
      aesthetics,
      performance,
      stability,
      accessibility,
      adaptability
    });
    
    // Record for trend analysis
    this.recordQuality(quality, context);
    
    return quality;
  }
  
  getQualityTrends(): QualityTrend[] {
    return this.analyzeTrends(this.qualityHistory);
  }
  
  getQualityRecommendations(quality: OverallQualityScore): string[] {
    const recommendations: string[] = [];
    
    if (quality.readability < 0.7) {
      recommendations.push("Increase node spacing to reduce overlap");
      recommendations.push("Consider different algorithm for better edge routing");
    }
    
    if (quality.performance < 0.6) {
      recommendations.push("Reduce thoroughness for faster computation");
      recommendations.push("Consider simpler algorithm for large graphs");
    }
    
    if (quality.accessibility < 0.7) {
      recommendations.push("Improve color contrast for better accessibility");
      recommendations.push("Add patterns for colorblind users");
    }
    
    return recommendations;
  }
}
```

### Quality Regression Testing
```typescript
describe('Layout Quality Regression Tests', () => {
  const examples = ['traffic-light', 'hsm-combobox', 'rock-paper-scissors'];
  const algorithms = ['layered', 'force', 'stress'];
  
  test.each(examples)('%s maintains quality standards', async (example) => {
    const machine = loadExample(example);
    const monitor = new LayoutQualityMonitor();
    
    for (const algorithm of algorithms) {
      const layout = await computeLayout(machine, { algorithm });
      const quality = await monitor.assessLayout(layout.nodes, layout.edges, {
        example,
        algorithm,
        timestamp: Date.now()
      });
      
      // Assert quality standards
      expect(quality.overallScore).toBeGreaterThan(0.7);
      expect(quality.readability).toBeGreaterThan(0.8);
      expect(quality.performance).toBeGreaterThan(0.6);
      expect(quality.accessibility).toBeGreaterThan(0.7);
      
      // Assert no regression from baseline
      const baseline = loadQualityBaseline(example, algorithm);
      expect(quality.overallScore).toBeGreaterThanOrEqual(baseline.overallScore - 0.05);
    }
  });
});
```

### Visual Quality Assessment
```typescript
describe('Visual Quality Assessment', () => {
  test('visual regression for layout changes', async () => {
    const page = await browser.newPage();
    await page.goto('/matchina/examples/traffic-light');
    
    // Test each algorithm
    for (const algorithm of ['layered', 'force', 'stress']) {
      await page.selectOption('#algorithm-select', algorithm);
      await page.waitForSelector('.react-flow-node');
      
      // Take screenshot for visual comparison
      const screenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      });
      
      // Compare with baseline
      const baseline = await loadBaselineScreenshot(`traffic-light-${algorithm}`);
      const diff = await compareImages(screenshot, baseline);
      
      // Allow minimal differences (antialiasing, rounding)
      expect(diff.percentage).toBeLessThan(0.02); // 2% max difference
    }
  });
});
```

## Quality Improvement Recommendations

### Algorithm-Specific Improvements

#### Layered Algorithm
```typescript
const layeredImprovements = {
  // Reduce edge crossings
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.crossingMinimization.semiInteractive": "true",
  
  // Improve node alignment
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.layered.alignment": "CENTER",
  
  // Better spacing control
  "elk.layered.spacing.nodeNodeBetweenLayers": "120",
  "elk.layered.spacing.edgeNodeBetweenLayers": "30",
  
  // Quality vs performance trade-off
  "elk.layered.thoroughness": "7"
};
```

#### Force Algorithm
```typescript
const forceImprovements = {
  // Better convergence
  "elk.force.iterations": "500",
  "elk.force.temperature": "0.1",
  "elk.force.coolingFactor": "0.95",
  
  // Improved forces
  "elk.force.repulsion": "150",
  "elk.force.attraction": "0.01",
  "elk.force.gravity": "0.1",
  
  // Stability improvements
  "elk.force.useModelOrder": "true",
  "elk.force.deterministic": "true"
};
```

#### Stress Algorithm
```typescript
const stressImprovements = {
  // Better optimization
  "elk.stress.iterationLimit": "500",
  "elk.stress.epsilon": "0.0001",
  "elk.stress.quality": "8",
  
  // Edge length control
  "elk.stress.desiredEdgeLength": "120",
  "elk.stress.edgeLengthScaling": "1.0",
  
  // Component handling
  "elk.stress.separateComponents": "true",
  "elk.stress.componentSpacing": "200"
};
```

### Context-Specific Optimizations

#### Mobile Optimization
```typescript
const mobileOptimizations = {
  // Compact layout
  nodeSpacing: 60,
  layerSpacing: 80,
  
  // Faster computation
  thoroughness: 3,
  
  // Simpler algorithm
  preferredAlgorithm: "layered",
  
  // Touch-friendly sizing
  minNodeSize: 44,
  minTouchTarget: 44
};
```

#### Desktop Optimization
```typescript
const desktopOptimizations = {
  // More space for clarity
  nodeSpacing: 120,
  layerSpacing: 150,
  
  // Higher quality
  thoroughness: 10,
  
  // Best algorithm for context
  preferredAlgorithm: "auto", // Choose based on graph type
  
  // Larger displays
  minNodeSize: 80,
  optimalAspectRatio: 1.8
};
```

## Quality Reporting

### Quality Dashboard
```typescript
interface QualityDashboard {
  overallTrends: QualityTrend[];
  exampleScores: Record<string, OverallQualityScore>;
  algorithmComparison: Record<string, QualityMetrics>;
  issueTracking: QualityIssue[];
  improvementSuggestions: string[];
}

const generateQualityReport = (
  history: QualityRecord[],
  context: ReportContext
): QualityDashboard => {
  return {
    overallTrends: analyzeQualityTrends(history),
    exampleScores: groupScoresByExample(history),
    algorithmComparison: compareAlgorithms(history),
    issueTracking: identifyQualityIssues(history),
    improvementSuggestions: generateImprovements(history)
  };
};
```

### Quality Alerts
```typescript
class QualityAlertSystem {
  checkQualityThresholds(quality: OverallQualityScore): Alert[] {
    const alerts: Alert[] = [];
    
    if (quality.readability < 0.6) {
      alerts.push({
        level: 'error',
        message: 'Critical readability issues detected',
        suggestion: 'Check for node overlaps and edge crossings'
      });
    }
    
    if (quality.performance < 0.5) {
      alerts.push({
        level: 'warning',
        message: 'Performance degradation detected',
        suggestion: 'Consider reducing thoroughness or using simpler algorithm'
      });
    }
    
    if (quality.accessibility < 0.7) {
      alerts.push({
        level: 'error',
        message: 'Accessibility compliance issues',
        suggestion: 'Improve color contrast and add non-visual indicators'
      });
    }
    
    return alerts;
  }
}
```

---

**Next Steps:**
1. Implement automated quality monitoring system
2. Create quality regression test suite
3. Build quality dashboard for tracking trends
4. Establish quality gates for CI/CD pipeline
5. Document quality standards for development team
