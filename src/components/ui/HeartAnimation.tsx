import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const HeartAnimation: React.FC<{ size?: number, className?: string }> = ({ size = 64, className = '' }) => {
  const outer = Math.round(size * 0.9);
  const inner = Math.round(size * 0.7);

  return (
    <div className={`relative w-${outer} h-${outer} flex items-center justify-center ${className}`} aria-hidden>
      {/* Background glow */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse" />

      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          animate={{ x: [-20, -5, -20], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute"
          style={{ mixBlendMode: 'screen' }}
        >
          <Heart
            className="text-primary"
            style={{ width: size * 0.9, height: size * 0.9, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary) / 0.4)', filter: 'drop-shadow(0 0 15px hsl(var(--primary) / 0.8))' }}
            strokeWidth={3}
          />
        </motion.div>

        <motion.div
          animate={{ x: [20, 5, 20], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute"
          style={{ mixBlendMode: 'screen' }}
        >
          <Heart
            className="text-white"
            style={{ width: size * 0.9, height: size * 0.9, stroke: 'white', fill: 'rgba(255,255,255,0.3)', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.8))' }}
            strokeWidth={3}
          />
        </motion.div>

        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute"
        >
          <Heart
            style={{ width: inner, height: inner, stroke: 'hsl(var(--primary-glow))', fill: 'none', filter: 'blur(2px) drop-shadow(0 0 20px hsl(var(--primary) / 0.6))' }}
            strokeWidth={4}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default HeartAnimation;
