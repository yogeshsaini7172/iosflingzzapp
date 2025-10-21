import { supabase } from '@/integrations/supabase/client';

export interface NewsArticle {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  external_link?: string;
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  author_name?: string;
  author_email?: string;
  tags: string[];
  category?: string;
  priority: number;
  view_count: number;
  metadata?: Record<string, any>;
}

export interface CreateNewsData {
  title: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  external_link?: string;
  status?: 'draft' | 'published' | 'archived';
  author_name?: string;
  author_email?: string;
  tags?: string[];
  category?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface UpdateNewsData extends Partial<CreateNewsData> {
  id: string;
}

// Get all news articles
export const getNewsArticles = async (): Promise<NewsArticle[]> => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching news articles:', error);
    throw error;
  }

  return data || [];
};

// Get news article by ID
export const getNewsArticle = async (id: string): Promise<NewsArticle | null> => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching news article:', error);
    throw error;
  }

  return data;
};

// Create new news article
export const createNewsArticle = async (newsData: CreateNewsData): Promise<NewsArticle> => {
  const { data, error } = await supabase
    .from('news')
    .insert([{
      ...newsData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating news article:', error);
    throw error;
  }

  return data;
};

// Update news article
export const updateNewsArticle = async (newsData: UpdateNewsData): Promise<NewsArticle> => {
  const { id, ...updateFields } = newsData;
  
  const { data, error } = await supabase
    .from('news')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating news article:', error);
    throw error;
  }

  return data;
};

// Delete news article
export const deleteNewsArticle = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting news article:', error);
    throw error;
  }
};

// Publish news article
export const publishNewsArticle = async (id: string): Promise<NewsArticle> => {
  const { data, error } = await supabase
    .from('news')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error publishing news article:', error);
    throw error;
  }

  return data;
};

// Archive news article
export const archiveNewsArticle = async (id: string): Promise<NewsArticle> => {
  const { data, error } = await supabase
    .from('news')
    .update({
      status: 'archived',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error archiving news article:', error);
    throw error;
  }

  return data;
};

// Get news articles by status
export const getNewsArticlesByStatus = async (status: string): Promise<NewsArticle[]> => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching news articles by status:', error);
    throw error;
  }

  return data || [];
};

// Get published news articles
export const getPublishedNewsArticles = async (): Promise<NewsArticle[]> => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching published news articles:', error);
    throw error;
  }

  return data || [];
};

// Increment view count
export const incrementViewCount = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('news')
    .update({
      view_count: supabase.raw('view_count + 1'),
    })
    .eq('id', id);

  if (error) {
    console.error('Error incrementing view count:', error);
    throw error;
  }
};
