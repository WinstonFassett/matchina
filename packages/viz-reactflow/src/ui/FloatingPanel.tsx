/**
 * Modern floating panel for layout controls
 * Uses Floating UI for reliable positioning
 */

import React, { useRef, useEffect } from 'react';
import {
  useFloating,
  autoUpdate,
  flip,
  shift,
  offset,
  arrow,
  FloatingPortal,
} from '@floating-ui/react';

interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  title?: string;
  width?: number;
  height?: number;
}

export function FloatingPanel({
  isOpen,
  onClose,
  anchorRef,
  children,
  title = 'Layout Controls',
  width = 320,
  height = 400,
}: FloatingPanelProps) {
  const arrowRef = useRef<HTMLDivElement>(null);
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: onClose,
    placement: 'right-start',
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: ['bottom-start', 'right-end', 'bottom-end'],
      }),
      shift({
        padding: 10,
      }),
      arrow({
        element: arrowRef,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Update reference element when anchor changes
  useEffect(() => {
    if (anchorRef.current) {
      refs.setReference(anchorRef.current);
    }
  }, [anchorRef, refs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        refs.floating.current &&
        !refs.floating.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef, refs]);

  if (!isOpen) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={{
          ...floatingStyles,
          width,
          height,
          maxHeight: 'calc(100vh - 20px)',
          maxWidth: 'calc(100vw - 20px)',
          zIndex: 50,
        }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
      >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Close panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 min-h-0">
            {children}
          </div>

          {/* Arrow */}
          <div
            ref={arrowRef}
            className="absolute bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700"
            style={{
              width: 8,
              height: 8,
              transform: 'rotate(-45deg)',
            }}
          />
        </div>
    </FloatingPortal>
  );
}
