import React from 'react';
import HeartAnimation from './HeartAnimation';

const Loader: React.FC<{ size?: number, className?: string, text?: string }> = ({ size = 56, className = '', text }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`} aria-live="polite">
      <HeartAnimation size={size} />
      {text && <div className="mt-3 text-sm text-muted-foreground">{text}</div>}
    </div>
  );
};

export default Loader;
