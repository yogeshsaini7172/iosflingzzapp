import React from 'react';
import HeartAnimation from './HeartAnimation';

const HeartLoader: React.FC<{ className?: string, size?: number }> = ({ className = '', size = 64 }) => {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden>
      <HeartAnimation size={size} />
    </div>
  );
};

export default HeartLoader;
