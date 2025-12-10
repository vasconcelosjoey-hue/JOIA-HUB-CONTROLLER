import React from 'react';

interface NeuralCoreProps {
  className?: string;
}

export const NeuralCore: React.FC<NeuralCoreProps> = ({ className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="coreGradient" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Orbit Ring - Slow Rotation */}
        <g className="origin-center animate-[spin_10s_linear_infinite] opacity-20">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" />
          <circle cx="100" cy="10" r="3" fill="currentColor" />
          <circle cx="100" cy="190" r="3" fill="currentColor" />
        </g>

        {/* Middle Data Ring - Medium Rotation Reverse */}
        <g className="origin-center animate-[spin_15s_linear_infinite_reverse] opacity-30">
           <path d="M 100, 100 m -60, 0 a 60,60 0 1,0 120,0 a 60,60 0 1,0 -120,0" fill="none" stroke="currentColor" strokeWidth="0.5" />
           {/* Data Nodes on Ring */}
           <circle cx="160" cy="100" r="2" fill="currentColor">
              <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
           </circle>
           <circle cx="40" cy="100" r="2" fill="currentColor">
              <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" begin="1s"/>
           </circle>
        </g>

        {/* Neural Connections (Static Geometry with pulsing opacity) */}
        <g className="text-black" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4">
            <line x1="100" y1="100" x2="100" y2="50" className="animate-pulse delay-75" />
            <line x1="100" y1="100" x2="143" y2="125" className="animate-pulse delay-150" />
            <line x1="100" y1="100" x2="57" y2="125" className="animate-pulse delay-300" />
        </g>

        {/* Inner Reactor - Fast Rotation (Behind Text) */}
        <g className="origin-center animate-[spin_3s_linear_infinite]">
            <path d="M 100 65 L 130 118 L 70 118 Z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* Central Core - Breathing Glow */}
        <circle cx="100" cy="100" r="25" fill="url(#coreGradient)" className="animate-pulse opacity-50">
            <animate attributeName="r" values="25;28;25" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* TEXT LOGO - CENTERED & ENLARGED */}
        <g className="pointer-events-none drop-shadow-md">
            {/* Moved Y from 110 to 105 for better vertical centering */}
            <text 
                x="100" 
                y="105" 
                textAnchor="middle" 
                fontSize="42" 
                fontWeight="900" 
                fill="currentColor" 
                letterSpacing="-1" 
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                JoI.A.
            </text>
            {/* Increased font size from 9 to 12 and adjusted Y/Spacing */}
            <text 
                x="100" 
                y="125" 
                textAnchor="middle" 
                fontSize="12" 
                fontWeight="800" 
                fill="currentColor" 
                letterSpacing="1" 
                opacity="0.9"
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                NEURAL HUB
            </text>
        </g>

      </svg>
    </div>
  );
};