import { supabase } from '@/integrations/supabase/client';

export interface Update {
  id: string;
  title: string;
  content: string;
  category: 'feature' | 'update' | 'announcement' | 'maintenance';
  status: 'draft' | 'published' | 'archived';
  target_audience: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  image_url?: string;
  external_link?: string;
  priority: number;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface CreateUpdateData {
  title: string;
  content: string;
  category?: 'feature' | 'update' | 'announcement' | 'maintenance';
  status?: 'draft' | 'published' | 'archived';
  target_audience?: string[];
  image_url?: string;
  external_link?: string;
  priority?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateUpdateData extends Partial<CreateUpdateData> {
  id: string;
}

// Get all updates
export const getUpdates = async (): Promise<Update[]> => {
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching updates:', error);
    throw error;
  }

  return data || [];
};

// Get update by ID
export const getUpdate = async (id: string): Promise<Update | null> => {
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching update:', error);
    throw error;
  }

  return data;
};

// Create new update
export const createUpdate = async (updateData: CreateUpdateData): Promise<Update> => {
  const { data, error } = await supabase
    .from('updates')
    .insert([{
      ...updateData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating update:', error);
    throw error;
  }

  return data;
};

// Update update
export const updateUpdate = async (updateData: UpdateUpdateData): Promise<Update> => {
  const { id, ...updateFields } = updateData;
  
  const { data, error } = await supabase
    .from('updates')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating update:', error);
    throw error;
  }

  return data;
};

// Delete update
export const deleteUpdate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('updates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting update:', error);
    throw error;
  }
};

// Publish update
export const publishUpdate = async (id: string): Promise<Update> => {
  const { data, error } = await supabase
    .from('updates')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error publishing update:', error);
    throw error;
  }

  return data;
};

// Archive update
export const archiveUpdate = async (id: string): Promise<Update> => {
  const { data, error } = await supabase
    .from('updates')
    .update({
      status: 'archived',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error archiving update:', error);
    throw error;
  }

  return data;
};

// Get updates by status
export const getUpdatesByStatus = async (status: string): Promise<Update[]> => {
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching updates by status:', error);
    throw error;
  }

  return data || [];
};

// Get updates by category
export const getUpdatesByCategory = async (category: string): Promise<Update[]> => {
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching updates by category:', error);
    throw error;
  }

  return data || [];
};
