// useDraggable.js — Custom hook for draggable floating panels
import { useState, useCallback, useRef, useEffect } from 'react';

export default function useDraggable(initialPosition = { x: 0, y: 0 }) {
  const [position, setPosition] = useState(initialPosition);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    // Only drag from primary button
    if (e.button !== 0) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      // Clamp to viewport
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - 60));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - 60));
      setPosition({ x: clampedX, y: clampedY });
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
