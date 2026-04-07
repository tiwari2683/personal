import React, { useState, useEffect, useRef } from 'react';

const SparkleCursor = () => {
  const [points, setPoints] = useState([]);
  const requestRef = useRef();

  useEffect(() => {
    const handleMouseMove = (e) => {
      const newPoint = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now(),
        opacity: 1,
        size: Math.random() * 4 + 2
      };
      setPoints((prev) => [...prev.slice(-20), newPoint]);
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const newPoint = {
        x: touch.clientX,
        y: touch.clientY,
        id: Date.now(),
        opacity: 1,
        size: Math.random() * 4 + 2
      };
      setPoints((prev) => [...prev.slice(-20), newPoint]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const animate = () => {
      setPoints((prev) => 
        prev
          .map((p) => ({ ...p, opacity: p.opacity - 0.05 }))
          .filter((p) => p.opacity > 0)
      );
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10000 }}>
      {points.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: 'var(--aurora-champagne)',
            borderRadius: '50%',
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 10px var(--liquid-gold-start)'
          }}
        />
      ))}
    </div>
  );
};

export default SparkleCursor;
