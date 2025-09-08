import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRequiredAuth } from './useRequiredAuth';
import { useToast } from './use-toast';

export interface UploadedImage {
  id: string;
  url: string;
  path: string;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { userId } = useRequiredAuth();
  const { toast } = useToast();

  const uploadImage = async (file: File, bucket: string = 'profile-images'): Promise<UploadedImage | null> => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images",
        variant: "destructive"
      });
      return null;
    }

    try {
      setUploading(true);

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return null;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return null;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);

      toast({
        title: "Image uploaded successfully",
        description: "Your image has been uploaded and is ready to use"
      });

      return {
        id: uploadData.path,
        url: urlData.publicUrl,
        path: uploadData.path
      };

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleImages = async (files: File[], bucket: string = 'profile-images'): Promise<UploadedImage[]> => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images",
        variant: "destructive"
      });
      return [];
    }

    try {
      setUploading(true);
      const uploadPromises = files.map(file => uploadImage(file, bucket));
      const results = await Promise.all(uploadPromises);
      return results.filter(Boolean) as UploadedImage[];
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      return [];
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (path: string, bucket: string = 'profile-images'): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      toast({
        title: "Image deleted",
        description: "Image has been removed successfully"
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete image",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    uploading
  };
};