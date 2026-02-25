'use client';

import { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  createdAt: number;
}

export default function SparkleCursor() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    let sparkleId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newSparkle: Sparkle = {
        id: sparkleId++,
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 10 + 5,
        createdAt: Date.now()
      };

      setSparkles(prev => [...prev, newSparkle]);

      // Remove sparkle after animation
      setTimeout(() => {
        setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
      }, 1000);
    };

    // Throttle mouse move events
    let lastTime = 0;
    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime > 50) {
        handleMouseMove(e);
        lastTime = now;
      }
    };

    window.addEventListener('mousemove', throttledMouseMove);

    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            animation: 'sparkleAnimation 1s ease-out forwards'
          }}
        >
          <svg
            width={sparkle.size}
            height={sparkle.size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill="#FFB6C1"
              opacity="0.8"
            />
          </svg>
        </div>
      ))}
      <style jsx>{`
        @keyframes sparkleAnimation {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
