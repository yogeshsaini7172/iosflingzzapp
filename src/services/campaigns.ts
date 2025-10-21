import { supabase } from '@/integrations/supabase/client';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  target_audience: string[];
  location: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  image_url?: string;
  external_link?: string;
  metadata?: Record<string, any>;
}

export interface CreateCampaignData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  target_audience?: string[];
  location?: string;
  image_url?: string;
  external_link?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  id: string;
}

// Get all campaigns
export const getCampaigns = async (): Promise<Campaign[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }

  return data || [];
};

// Get campaign by ID
export const getCampaign = async (id: string): Promise<Campaign | null> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching campaign:', error);
    throw error;
  }

  return data;
};

// Create new campaign
export const createCampaign = async (campaignData: CreateCampaignData): Promise<Campaign> => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([{
      ...campaignData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }

  return data;
};

// Update campaign
export const updateCampaign = async (campaignData: UpdateCampaignData): Promise<Campaign> => {
  const { id, ...updateData } = campaignData;
  
  const { data, error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }

  return data;
};

// Delete campaign
export const deleteCampaign = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// Publish campaign
export const publishCampaign = async (id: string): Promise<Campaign> => {
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      status: 'active',
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error publishing campaign:', error);
    throw error;
  }

  return data;
};

// Archive campaign
export const archiveCampaign = async (id: string): Promise<Campaign> => {
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      status: 'archived',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error archiving campaign:', error);
    throw error;
  }

  return data;
};

// Get campaigns by status
export const getCampaignsByStatus = async (status: string): Promise<Campaign[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns by status:', error);
    throw error;
  }

  return data || [];
};
