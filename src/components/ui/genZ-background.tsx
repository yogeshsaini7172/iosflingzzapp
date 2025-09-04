import React, { useEffect, useState } from 'react';

interface GenZBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'setup' | 'app';
}

const GenZBackground: React.FC<GenZBackgroundProps> = ({ children, variant = 'default' }) => {
  const [floatingElements, setFloatingElements] = useState<Array<{
    id: number;
    emoji: string;
    size: string;
    left: string;
    top: string;
    delay: string;
  }>>([]);

  useEffect(() => {
    const emojis = ['💜', '💕', '✨', '🔥', '💫', '🌙', '💎', '🦄', '🌈', '⭐', '💖', '🌟'];
    const elements = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      size: `${Math.random() * 30 + 20}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`
    }));
    setFloatingElements(elements);
  }, []);

  const getVariantStyles = () => {
    switch (variant) {
      case 'auth':
        return 'bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900';
      case 'setup':
        return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900';
      case 'app':
        return 'bg-gradient-to-br from-black via-purple-950 to-pink-950';
      default:
        return 'bg-gradient-to-br from-purple-900 via-pink-900 to-black';
    }
  };

  return (
    <div className={`genZ-app-container ${getVariantStyles()} relative min-h-screen overflow-hidden`}>
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl animate-bounce-slow delay-500"></div>
        <div className="absolute top-10 right-10 w-48 h-48 bg-yellow-500/10 rounded-full blur-xl animate-float delay-2000"></div>
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-green-500/10 rounded-full blur-2xl animate-pulse-glow delay-1500"></div>
      </div>

      {/* Floating emoji elements */}
      {floatingElements.map((element) => (
        <div
          key={element.id}
          className="genZ-floating-element"
          style={{
            fontSize: element.size,
            left: element.left,
            top: element.top,
            animationDelay: element.delay,
          }}
        >
          {element.emoji}
        </div>
      ))}

      {/* Geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-4 h-4 bg-purple-400/30 rotate-45 animate-spin-slow"></div>
        <div className="absolute top-3/4 right-1/6 w-6 h-6 bg-pink-400/30 rounded-full animate-bounce-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-3 h-12 bg-blue-400/30 rotate-12 animate-wiggle delay-500"></div>
        <div className="absolute bottom-1/4 right-1/3 w-8 h-8 bg-yellow-400/30 rotate-45 animate-float delay-2000"></div>
        <div className="absolute top-1/6 right-1/2 w-5 h-5 bg-green-400/30 rounded-full animate-pulse-glow delay-1500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GenZBackground;