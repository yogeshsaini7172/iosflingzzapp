import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileImageHandlerProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
}

const ProfileImageHandler = ({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
  onError
}: ProfileImageHandlerProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return fallbackSrc;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    
    // Get from Supabase storage
    return supabase.storage.from('profile-images').getPublicUrl(imagePath).data.publicUrl;
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      onError?.();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img 
        src={imageError ? fallbackSrc : getImageUrl(src)}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default ProfileImageHandler;