import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ExternalLink,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  Image,
  Newspaper
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getNewsArticles, 
  createNewsArticle, 
  updateNewsArticle, 
  deleteNewsArticle, 
  publishNewsArticle, 
  archiveNewsArticle,
  type NewsArticle,
  type CreateNewsData 
} from '@/services/news';

const NewsManager = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<CreateNewsData>({
    title: '',
    excerpt: '',
    content: '',
    status: 'draft',
    tags: [],
  });
  const { toast } = useToast();

  // Fetch news articles from database
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const data = await getNewsArticles();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching news articles:', error);
      toast({
        title: "Error",
        description: "Failed to load news articles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        await updateNewsArticle({ ...formData, id: editingArticle.id });
        toast({
          title: "Success",
          description: "News article updated successfully"
        });
      } else {
        await createNewsArticle(formData);
        toast({
          title: "Success",
          description: "News article created successfully"
        });
      }
      setShowCreateForm(false);
      setEditingArticle(null);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        status: 'draft',
        tags: [],
      });
      fetchArticles();
    } catch (error) {
      console.error('Error saving news article:', error);
      toast({
        title: "Error",
        description: "Failed to save news article",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt || '',
      content: article.content,
      status: article.status,
      tags: article.tags,
    });
    setShowCreateForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this news article?')) {
      try {
        await deleteNewsArticle(id);
        toast({
          title: "Success",
          description: "News article deleted successfully"
        });
        fetchArticles();
      } catch (error) {
        console.error('Error deleting news article:', error);
        toast({
          title: "Error",
          description: "Failed to delete news article",
          variant: "destructive"
        });
      }
    }
  };

  // Handle publish
  const handlePublish = async (id: string) => {
    try {
      await publishNewsArticle(id);
      toast({
        title: "Success",
        description: "News article published successfully"
      });
      fetchArticles();
    } catch (error) {
      console.error('Error publishing news article:', error);
      toast({
        title: "Error",
        description: "Failed to publish news article",
        variant: "destructive"
      });
    }
  };

  // Handle archive
  const handleArchive = async (id: string) => {
    try {
      await archiveNewsArticle(id);
      toast({
        title: "Success",
        description: "News article archived successfully"
      });
      fetchArticles();
    } catch (error) {
      console.error('Error archiving news article:', error);
      toast({
        title: "Error",
        description: "Failed to archive news article",
        variant: "destructive"
      });
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (article.excerpt && article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">News Management</h2>
          <p className="text-muted-foreground">Manage news articles and press releases</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Article
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Articles List */}
      <div className="grid gap-4">
        {filteredArticles.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{article.excerpt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(article.status)}>
                    {article.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Created {article.created_at}</span>
                </div>
                {article.published_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Published {article.published_at}</span>
                  </div>
                )}
                {article.featured_image && (
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    <span>Has image</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {article.external_link && (
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    External Link
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Newspaper className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first article to get started'
              }
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Article
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewsManager;