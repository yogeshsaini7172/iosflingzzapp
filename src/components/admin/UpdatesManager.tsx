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
  Clock,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getUpdates, 
  createUpdate, 
  updateUpdate, 
  deleteUpdate, 
  publishUpdate, 
  archiveUpdate,
  type Update,
  type CreateUpdateData 
} from '@/services/updates';

const UpdatesManager = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUpdateData>({
    title: '',
    content: '',
    category: 'update',
    status: 'draft',
    target_audience: [],
  });
  const { toast } = useToast();

  // Fetch updates from database
  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const data = await getUpdates();
      setUpdates(data);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast({
        title: "Error",
        description: "Failed to load updates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUpdate) {
        await updateUpdate({ ...formData, id: editingUpdate.id });
        toast({
          title: "Success",
          description: "Update updated successfully"
        });
      } else {
        await createUpdate(formData);
        toast({
          title: "Success",
          description: "Update created successfully"
        });
      }
      setShowCreateForm(false);
      setEditingUpdate(null);
      setFormData({
        title: '',
        content: '',
        category: 'update',
        status: 'draft',
        target_audience: [],
      });
      fetchUpdates();
    } catch (error) {
      console.error('Error saving update:', error);
      toast({
        title: "Error",
        description: "Failed to save update",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (update: Update) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      content: update.content,
      category: update.category,
      status: update.status,
      target_audience: update.target_audience,
    });
    setShowCreateForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteUpdate(id);
      toast({
        title: "Success",
        description: "Update deleted successfully"
      });
      setDeleteConfirmId(null);
      fetchUpdates();
    } catch (error) {
      console.error('Error deleting update:', error);
      toast({
        title: "Error",
        description: "Failed to delete update",
        variant: "destructive"
      });
    }
  };

  // Handle publish
  const handlePublish = async (id: string) => {
    try {
      await publishUpdate(id);
      toast({
        title: "Success",
        description: "Update published successfully"
      });
      fetchUpdates();
    } catch (error) {
      console.error('Error publishing update:', error);
      toast({
        title: "Error",
        description: "Failed to publish update",
        variant: "destructive"
      });
    }
  };

  // Handle archive
  const handleArchive = async (id: string) => {
    try {
      await archiveUpdate(id);
      toast({
        title: "Success",
        description: "Update archived successfully"
      });
      fetchUpdates();
    } catch (error) {
      console.error('Error archiving update:', error);
      toast({
        title: "Error",
        description: "Failed to archive update",
        variant: "destructive"
      });
    }
  };

  const filteredUpdates = updates.filter(update => {
    const matchesSearch = update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         update.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || update.status === statusFilter;
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-purple-100 text-purple-800';
      case 'announcement': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
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
          <h2 className="text-2xl font-bold">Updates Management</h2>
          <p className="text-muted-foreground">Manage app updates and announcements</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Update
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search updates..."
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

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingUpdate ? 'Edit Update' : 'Create New Update'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={6}
                  placeholder="Update details..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="feature">Feature</option>
                    <option value="update">Update</option>
                    <option value="announcement">Announcement</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="external_link">External Link</Label>
                  <Input
                    id="external_link"
                    value={formData.external_link}
                    onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority (0-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingUpdate ? 'Update' : 'Create'} Update
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingUpdate(null);
                    setFormData({
                      title: '',
                      content: '',
                      category: 'update',
                      status: 'draft',
                      target_audience: [],
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Updates List */}
      <div className="grid gap-4">
        {filteredUpdates.map((update) => (
          <Card key={update.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{update.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{update.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(update.category)}>
                    {update.category}
                  </Badge>
                  <Badge className={getStatusColor(update.status)}>
                    {update.status}
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
                  <span>Created {update.created_at}</span>
                </div>
                {update.published_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Published {update.published_at}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(update)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {update.status === 'draft' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePublish(update.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                )}
                {update.status === 'published' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleArchive(update.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => setDeleteConfirmId(update.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUpdates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No updates found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first update to get started'
              }
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Update
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this update? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteConfirmId)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UpdatesManager;