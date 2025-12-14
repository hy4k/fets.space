
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-12" }) => {
  return (
    <svg viewBox="0 0 320 80" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" aria-label="forun Educational & Testing Services">
      {/* Dots Group */}
      <g>
        {/* Column 1 - Red/Pinks */}
        <circle cx="10" cy="10" r="8" fill="#ef4444" />
        <circle cx="10" cy="30" r="8" fill="#f43f5e" />
        <circle cx="10" cy="50" r="8" fill="#ec4899" />
        <circle cx="10" cy="70" r="8" fill="#d946ef" />

        {/* Column 2 - Oranges */}
        <circle cx="30" cy="30" r="8" fill="#f97316" />
        <circle cx="30" cy="50" r="8" fill="#f59e0b" />
        <circle cx="30" cy="70" r="8" fill="#fbbf24" />

        {/* Column 3 - Yellows/Greens */}
        <circle cx="50" cy="10" r="8" fill="#facc15" />
        <circle cx="50" cy="30" r="8" fill="#eab308" />
        <circle cx="50" cy="70" r="8" fill="#84cc16" />

        {/* Column 4 - Purple */}
        <circle cx="70" cy="70" r="8" fill="#7c3aed" />
      </g>

      {/* Main Text */}
      <text x="95" y="60" fontFamily="sans-serif" fontWeight="900" fontSize="55" fill="#1f2937" letterSpacing="-3">forun</text>
      
      {/* Tagline */}
      <text x="98" y="78" fontFamily="sans-serif" fontWeight="700" fontSize="9.5" fill="#4b5563" letterSpacing="0.2">Educational & Testing Services</text>
    </svg>
  );
};
