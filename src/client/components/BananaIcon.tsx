import React from 'react';

interface BananaIconProps {
  className?: string;
  size?: number;
}

export const BananaIcon: React.FC<BananaIconProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#65A30D" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      
      {/* Banana Body */}
      <path
        d="M 46 16 C 42 14, 38 16, 34 20 C 25 29, 16 39, 16 48 C 16 52, 19 54, 23 52 C 33 47, 44 38, 47 28 C 49 23, 49 18, 46 16 Z"
        fill="url(#bananaGrad)"
        stroke="#CA8A04"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Inner Highlight */}
      <path
        d="M 36 22 C 28 31, 21 40, 21 47"
        fill="none"
        stroke="#FEF08A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      
      {/* Stem */}
      <path
        d="M 46 16 L 51 11 C 52 10, 54 11, 53 13 L 48 18 Z"
        fill="url(#stemGrad)"
        stroke="#4D7C0F"
        strokeWidth="1.2"
      />
      
      {/* Tip */}
      <circle cx="17.5" cy="50.5" r="2" fill="#78350F" />
    </svg>
  );
};
