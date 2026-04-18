// useDraggable.js — Custom hook for draggable floating panels
// CRITICAL FIX: Uses refs for position to avoid stale closure issues in mousedown handler.
// Supports both expanded and collapsed states without re-initialization.
import { useState, useCallback, useRef, useEffect } from 'react';

export default function useDraggable(initialPosition = { x: 0, y: 0 }) {
  const [position, setPosition] = useState(initialPosition);
  const positionRef = useRef(initialPosition);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Keep ref in sync with state
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const handleMouseDown = useCallback((e) => {
    // Only drag from primary button
    if (e.button !== 0) return;

    // Don't initiate drag on clickable elements (buttons, selects, inputs)
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'button' || tag === 'select' || tag === 'input' || tag === 'option') return;

    isDragging.current = true;
    // Use ref for current position — avoids stale closure
    dragOffset.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
    e.preventDefault();
  }, []); // No dependency on position — uses ref instead

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      // Clamp to viewport with padding
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - 60));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - 60));
      const newPos = { x: clampedX, y: clampedY };
      positionRef.current = newPos;
      setPosition(newPos);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return { position, handleMouseDown, isDragging: isDragging.current };
}
