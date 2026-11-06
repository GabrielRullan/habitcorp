import React, { useEffect, useState } from 'react';
import { generateCelebrationParticles, CelebrationParticle } from '../utils/celebration';

interface CelebrationOverlayProps {
  triggerKey: number;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ triggerKey }) => {
  const [particles, setParticles] = useState<CelebrationParticle[]>([]);

  useEffect(() => {
    if (triggerKey === 0) return;
    const newParticles = generateCelebrationParticles(22);
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 1200);

    return () => clearTimeout(timer);
  }, [triggerKey]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute transition-all duration-1000 ease-out inline-block animate-float-up"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            color: p.color,
            transform: `translate(${p.vx}px, ${p.vy}px)`,
            opacity: 0.9,
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
};
