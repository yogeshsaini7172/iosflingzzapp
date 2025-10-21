import React from 'react';
import { Heart } from 'lucide-react';

const HeartLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden>
      <div className="animate-pulse">
        <Heart className="w-12 h-12 text-pink-500" />
      </div>
    </div>
  );
};

export default HeartLoader;
