import React, { memo } from 'react';
import { Heart } from 'lucide-react';

const HeartAnimation: React.FC<{ size?: number, className?: string }> = memo(({ size = 64, className = '' }) => {
  const outer = Math.round(size * 0.9);
  const inner = Math.round(size * 0.7);

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      style={{ width: outer, height: outer }}
      aria-hidden
    >
      {/* Background glow */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse" />

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Left Heart - using Tailwind animations */}
        <div
          className="absolute animate-bounce"
          style={{ 
            mixBlendMode: 'screen',
            animationDuration: '2.5s',
            animationDelay: '0s'
          }}
        >
          <Heart
            className="text-primary"
            style={{ width: size * 0.9, height: size * 0.9, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary) / 0.4)', filter: 'drop-shadow(0 0 15px hsl(var(--primary) / 0.8))' }}
            strokeWidth={3}
          />
        </div>

        {/* Right Heart - using Tailwind animations */}
        <div
          className="absolute animate-bounce"
          style={{ 
            mixBlendMode: 'screen',
            animationDuration: '2.5s',
            animationDelay: '0.5s'
          }}
        >
          <Heart
            className="text-white"
            style={{ width: size * 0.9, height: size * 0.9, stroke: 'white', fill: 'rgba(255,255,255,0.3)', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.8))' }}
            strokeWidth={3}
          />
        </div>

        {/* Center Heart - using Tailwind animations */}
        <div
          className="absolute animate-pulse"
          style={{ 
            animationDuration: '2.5s',
            animationDelay: '1s'
          }}
        >
          <Heart
            style={{ width: inner, height: inner, stroke: 'hsl(var(--primary-glow))', fill: 'none', filter: 'blur(2px) drop-shadow(0 0 20px hsl(var(--primary) / 0.6))' }}
            strokeWidth={4}
          />
        </div>
      </div>
    </div>
  );
});

export default HeartAnimation;
