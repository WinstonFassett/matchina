// Coordinate Analysis Tool - Because I'm shit at visual reasoning
interface Label {
  text: string;
  x: number;
  y: number;
  edge: string;
  direction: string;
}

interface AnalysisResult {
  overlapping: boolean;
  issues: string[];
  clockwiseCorrect: boolean;
  separation: number;
  recommendations: string[];
}

export function analyzeLabelPositions(labels: Label[]): AnalysisResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for overlapping labels
  const overlappingPairs: string[] = [];
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const label1 = labels[i];
      const label2 = labels[j];
      
      // Check if labels overlap (within 30px tolerance)
      const distance = Math.sqrt(
        Math.pow(label1.x - label2.x, 2) + Math.pow(label1.y - label2.y, 2)
      );
      
      if (distance < 30) {
        overlappingPairs.push(`${label1.text} and ${label2.text} overlap (${distance.toFixed(1)}px)`);
      }
    }
  }
  
  if (overlappingPairs.length > 0) {
    issues.push(...overlappingPairs);
    recommendations.push("Increase label separation to at least 30px");
  }
  
  // Check clockwise flow for vertical layout
  const rightSideLabels = labels.filter(l => l.x > 125); // Assuming center is around 125px
  const leftSideLabels = labels.filter(l => l.x <= 125);
  
  const grayLabels = labels.filter(l => l.edge.includes('Off')); // On→Off edges
  const blueLabels = labels.filter(l => l.edge.includes('On')); // Off→On edges
  
  // Clockwise flow: gray (On→Off) should be right, blue (Off→On) should be left
  const grayOnRight = grayLabels.every(l => l.x > 125);
  const blueOnLeft = blueLabels.every(l => l.x <= 125);
  const clockwiseCorrect = grayOnRight && blueOnLeft;
  
  if (!clockwiseCorrect) {
    issues.push("Clockwise flow incorrect");
    if (!grayOnRight) {
      issues.push("Gray labels (On→Off) should be on right side");
      recommendations.push("Move gray labels to right side of vertical layout");
    }
    if (!blueOnLeft) {
      issues.push("Blue labels (Off→On) should be on left side");
      recommendations.push("Move blue labels to left side of vertical layout");
    }
  }
  
  // Calculate minimum separation
  let minSeparation = Infinity;
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const distance = Math.sqrt(
        Math.pow(labels[i].x - labels[j].x, 2) + 
        Math.pow(labels[i].y - labels[j].y, 2)
      );
      minSeparation = Math.min(minSeparation, distance);
    }
  }
  
  // Check if labels are within reasonable viewport bounds
  const outOfBounds = labels.filter(l => l.x < 0 || l.x > 500 || l.y < 0 || l.y > 300);
  if (outOfBounds.length > 0) {
    issues.push(`${outOfBounds.length} labels outside viewport bounds`);
    recommendations.push("Keep all labels within viewport (0-500px x 0-300px)");
  }
  
  return {
    overlapping: overlappingPairs.length > 0,
    issues,
    clockwiseCorrect,
    separation: minSeparation,
    recommendations
  };
}

// Console logging helper for ReactFlow
export function logLabelAnalysis() {
  // This will be called from CustomEdge.tsx to capture and analyze label positions
  console.log("🔍 COORDINATE ANALYSIS: Because I'm shit at visual reasoning");
}
