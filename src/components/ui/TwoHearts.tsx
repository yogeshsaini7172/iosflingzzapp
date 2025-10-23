import React from 'react';
import { Heart } from 'lucide-react';
import { motion, Variant } from 'framer-motion';

const TwoHearts: React.FC<{ size?: number; message?: string }> = ({ size = 48, message }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{
            scale: [1, 1.25, 1],
            y: [0, -6, 0],
            transition: {
              delay: 0,
              duration: 1.1,
              repeat: Infinity,
              ease: 'easeInOut' as const
            }
          }}
        >
          <Heart className="text-pink-500 drop-shadow-lg" style={{ width: size, height: size }} />
        </motion.div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{
            scale: [1, 1.25, 1],
            y: [0, -6, 0],
            transition: {
              delay: 0.15,
              duration: 1.1,
              repeat: Infinity,
              ease: 'easeInOut' as const
            }
          }}
        >
          <Heart className="text-red-500 drop-shadow-lg" style={{ width: size * 0.9, height: size * 0.9 }} />
        </motion.div>
      </div>
      {message && <div className="mt-3 text-sm text-muted-foreground">{message}</div>}
    </div>
  );
};

export default TwoHearts;
