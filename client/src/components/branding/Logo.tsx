import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'dark' 
}) => {
  const sizes = {
    small: { height: 32, width: 32 },
    medium: { height: 48, width: 48 },
    large: { height: 64, width: 64 }
  };

  const colors = {
    light: {
      dna: '#00FFD1', // Bright teal for DNA helix
      strands: '#0891B2', // Blue for connecting strands
      brackets: '#FFFFFF', // White brackets
      text: '#FFFFFF' // White text
    },
    dark: {
      dna: '#00FFD1', // Keep teal DNA helix
      strands: '#0891B2', // Keep blue strands
      brackets: '#FFFFFF', // White brackets
      text: '#FFFFFF' // White text on dark
    }
  };

  const themeColors = colors[variant];

  return (
    <div className="flex items-center gap-2">
      <div style={{ height: sizes[size].height, width: sizes[size].width }}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Bracket */}
          <path 
            d="M20 10 L30 10 L30 90 L20 90" 
            stroke={themeColors.brackets} 
            strokeWidth="4" 
            fill="none"
          />
          
          {/* DNA Double Helix */}
          <path 
            d="M35 20 Q50 30 65 20 T95 20 M35 40 Q50 50 65 40 T95 40 M35 60 Q50 70 65 60 T95 60 M35 80 Q50 90 65 80 T95 80"
            stroke={themeColors.dna} 
            strokeWidth="3"
          />
          
          {/* Connecting Strands */}
          <path 
            d="M35 20 L35 80 M65 20 L65 80" 
            stroke={themeColors.strands} 
            strokeWidth="2" 
            strokeDasharray="4 4"
          />
          
          {/* Right Bracket */}
          <path 
            d="M80 10 L70 10 L70 90 L80 90" 
            stroke={themeColors.brackets} 
            strokeWidth="4" 
            fill="none"
          />
        </svg>
      </div>
      <span 
        className={`font-heading font-bold ${
          size === 'small' ? 'text-xl' : 
          size === 'medium' ? 'text-2xl' : 
          'text-3xl'
        }`}
        style={{ color: themeColors.text }}
      >
        BioScriptor
      </span>
    </div>
  );
};
