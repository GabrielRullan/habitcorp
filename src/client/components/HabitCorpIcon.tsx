import React from 'react';

export const HabitCorpIcon: React.FC<{
  className?: string;
  variant?: 'full' | 'head';
}> = ({ className = 'w-6 h-6', variant = 'full' }) => {
  const src = variant === 'head' ? '/favicon.png' : '/goblin-logo.png';
  return (
    <img
      src={src}
      alt="HabitCorp Goblin Logo"
      className={`object-cover select-none rounded-lg ${className}`}
      draggable={false}
    />
  );
};

export default HabitCorpIcon;
