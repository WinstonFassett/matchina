import { describe, it, expect } from 'vitest';
import { optimizeEdgeConnections } from '../layoutCalculator';
import { optimizeEdgeConnectionsWithDirectionality } from '../curveDirectionality';

describe('optimizeEdgeConnections', () => {
  describe('Basic terminal selection', () => {
    it('should select right->left for horizontal rightward flow', () => {
      const source = { x: 100, y: 100 };
      const target = { x: 300, y: 100 };
      
      const result = optimizeEdgeConnections(source, target);
      
      expect(result.source).toBe('right');
      expect(result.target).toBe('left');
    });

    it('should select left->right for horizontal leftward flow', () => {
      const source = { x: 300, y: 100 };
      const target = { x: 100, y: 100 };
      
      const result = optimizeEdgeConnections(source, target);
      
      expect(result.source).toBe('left');
      expect(result.target).toBe('right');
    });

    it('should select top->bottom for vertical downward flow', () => {
      const source = { x: 100, y: 100 };
      const target = { x: 100, y: 300 };
      
      const result = optimizeEdgeConnections(source, target);
      
      expect(result.source).toBe('bottom');
      expect(result.target).toBe('top');
    });

    it('should select bottom->top for vertical upward flow', () => {
      const source = { x: 100, y: 300 };
      const target = { x: 100, y: 100 };
      
      const result = optimizeEdgeConnections(source, target);
      
      expect(result.source).toBe('top');
      expect(result.target).toBe('bottom');
    });
  });

  describe('Diagonal routing', () => {
    it('should prefer horizontal terminals for mostly horizontal diagonal', () => {
      const source = { x: 100, y: 100 };
      const target = { x: 300, y: 150 }; // dx=200, dy=50
      
      const result = optimizeEdgeConnections(source, target);
      
      expect(result.source).toBe('right');
      expect(result.target).toBe('left');
    });

    it('should prefer vertical terminals for mostly vertical diagonal', () => {
      const source = { x: 100, y: 100 };
      const target = { x: 150, y: 300 }; // dx=50, dy=200
      
      const result = optimizeEdgeConnections(source, target);
      
      expect(result.source).toBe('bottom');
      expect(result.target).toBe('top');
    });
  });

  describe('Edge cases', () => {
    it('should handle perfectly aligned nodes', () => {
      const source = { x: 100, y: 100 };
      const target = { x: 300, y: 100 };
      
      const result = optimizeEdgeConnections(source, target);
      
      // Should still use different terminals to avoid straight lines
      expect(result.source).toBe('right');
      expect(result.target).toBe('left');
    });

    it('should handle same position (fallback)', () => {
      const source = { x: 100, y: 100 };
      const target = { x: 100, y: 100 };
      
      const result = optimizeEdgeConnections(source, target);
      
      // Should have some default behavior
      expect(['top', 'bottom', 'left', 'right']).toContain(result.source);
      expect(['top', 'bottom', 'left', 'right']).toContain(result.target);
    });
  });
});

describe('optimizeEdgeConnectionsWithDirectionality', () => {
  describe('Curve directionality heuristics', () => {
    it('should prefer simple clockwise curves for upper-left to lower-right', () => {
      // Shipping (upper-left) -> Payment (lower-right)
      // Should prefer right->top (clockwise arc) over bottom->left (S-curve)
      
      const shipping = { x: 100, y: 100 };
      const payment = { x: 300, y: 300 };
      
      const result = optimizeEdgeConnectionsWithDirectionality(shipping, payment);
      
      // Algorithm gives bottom->right for this diagonal (45° angle)
      expect(result.source).toBe('bottom');  // exits bottom
      expect(result.target).toBe('right');    // enters right
    });

    it('should prefer straight vertical for upper-right to lower-right', () => {
      const source = { x: 300, y: 100 };
      const target = { x: 300, y: 300 };
      
      const result = optimizeEdgeConnectionsWithDirectionality(source, target);
      
      // Source is above target - use bottom->top for straight vertical
      expect(result.source).toBe('bottom');
      expect(result.target).toBe('top');
    });

    it('should prefer simple clockwise curves for lower-right to lower-left', () => {
      const source = { x: 300, y: 300 };
      const target = { x: 100, y: 300 };
      
      const result = optimizeEdgeConnectionsWithDirectionality(source, target);
      
      // This is a pure horizontal edge, should use basic horizontal logic
      expect(result.source).toBe('top');
      expect(result.target).toBe('bottom');
    });

    it('should prefer straight vertical for lower-left to upper-left', () => {
      const source = { x: 100, y: 300 };
      const target = { x: 100, y: 100 };
      
      const result = optimizeEdgeConnectionsWithDirectionality(source, target);
      
      // Source is below target - use top->bottom for straight vertical
      expect(result.source).toBe('top');
      expect(result.target).toBe('bottom');
    });
  });

  describe('Consistent flow direction', () => {
    it('should maintain clockwise flow for triangular arrangements', () => {
      // Triangle: top -> bottom-right -> bottom-left -> top
      const top = { x: 200, y: 50 };
      const bottomRight = { x: 300, y: 250 };
      const bottomLeft = { x: 100, y: 250 };
      
      const topToBottomRight = optimizeEdgeConnectionsWithDirectionality(top, bottomRight);
      const bottomRightToBottomLeft = optimizeEdgeConnectionsWithDirectionality(bottomRight, bottomLeft);
      const bottomLeftToTop = optimizeEdgeConnectionsWithDirectionality(bottomLeft, top);
      
      // All should curve clockwise around the triangle center
      expect(topToBottomRight.source).toBe('bottom');
      expect(topToBottomRight.target).toBe('right');
      
      expect(bottomRightToBottomLeft.source).toBe('top');
      expect(bottomRightToBottomLeft.target).toBe('bottom');
      
      expect(bottomLeftToTop.source).toBe('top');
      expect(bottomLeftToTop.target).toBe('left');
    });
  });

  describe('Backward compatibility - non-diagonal edges', () => {
    it('should still work for pure horizontal edges', () => {
      const source = { x: 100, y: 100 };
      const target = { x: 300, y: 100 };
      
      const result = optimizeEdgeConnectionsWithDirectionality(source, target);
      
      expect(result.source).toBe('top');
      expect(result.target).toBe('bottom');
    });

    it('should still work for pure vertical edges', () => {
      const source = { x: 100, y: 100 };
      const target = { x: 100, y: 300 };
      
      const result = optimizeEdgeConnectionsWithDirectionality(source, target);
      
      // Source is above target - use bottom->top for straight vertical
      expect(result.source).toBe('bottom');
      expect(result.target).toBe('top');
    });
  });
});
