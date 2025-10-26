import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Loader from '@/components/ui/Loader';
import { 
  MessageSquare, 
  Clock, 
  User, 
  Mail, 
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Reply,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ConsultingRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestType: string;
  description: string;
  existingPreferences: any;
  status: 'pending' | 'in_progress' | 'completed' | 'closed';
  createdAt: string;
  updatedAt: string;
  adminResponse?: string;
  respondedBy?: string;
  respondedAt?: string;
}

const ConsultingManager = () => {
  const [requests, setRequests] = useState<ConsultingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConsultingRequest | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consulting_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include user info (mock for now)
      const transformedRequests: ConsultingRequest[] = (data || []).map((req: any) => ({
        id: req.id,
        userId: req.user_id,
        userName: `User ${req.user_id.slice(0, 8)}`, // Mock user name
        userEmail: `user${req.user_id.slice(0, 8)}@example.com`, // Mock email
        requestType: req.request_type,
        description: req.description,
        existingPreferences: req.existing_preferences,
        status: req.status,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
        adminResponse: req.admin_response,
        respondedBy: req.responded_by,
        respondedAt: req.responded_at
      }));

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load consulting requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consulting_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Request status updated to ${newStatus}`
      });

      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive"
      });
    }
  };

  const handleResponseSubmit = async () => {
    if (!selectedRequest || !responseText.trim()) return;

    try {
      const { error } = await supabase
        .from('consulting_requests')
        .update({
          admin_response: responseText,
          status: 'completed',
          responded_by: 'admin', // Replace with actual admin ID
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Response Sent",
        description: "Your response has been sent to the user"
      });

      setShowResponseForm(false);
      setResponseText('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
  <Loader size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Consulting Management</h2>
          <p className="text-muted-foreground">Manage user consulting requests and responses</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {requests.filter(r => r.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline">
            {requests.filter(r => r.status === 'in_progress').length} In Progress
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            placeholder="Search requests..."
            className="w-full px-3 py-2 pl-10 border border-border rounded-md bg-background"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {request.userName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {request.requestType} • {request.userEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Request Description</Label>
                  <p className="text-sm text-muted-foreground mt-1 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'}}>
                    {request.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                  {request.respondedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Responded {new Date(request.respondedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  
                  {request.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Start Progress
                    </Button>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowResponseForm(true);
                      }}
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Respond
                    </Button>
                  )}
                  
                  {request.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, 'closed')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground text-center">
              {statusFilter !== 'all' 
                ? 'No requests match the current filter'
                : 'No consulting requests have been submitted yet'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Details Modal */}
      {selectedRequest && !showResponseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRequest(null)}>
          <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">Request Details</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Full information about this consulting request</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User Name</Label>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedRequest.userName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {selectedRequest.userEmail}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Request Type</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRequest.requestType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>

              {/* Request Description */}
              <div>
                <Label className="text-sm font-medium">Request Description</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Existing Preferences */}
              {selectedRequest.existingPreferences && (
                <div>
                  <Label className="text-sm font-medium">User's Current Preferences</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-md">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedRequest.existingPreferences, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Admin Response (if exists) */}
              {selectedRequest.adminResponse && (
                <div>
                  <Label className="text-sm font-medium">Admin Response</Label>
                  <div className="mt-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedRequest.adminResponse}</p>
                    {selectedRequest.respondedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Responded on {new Date(selectedRequest.respondedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedRequest.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </Button>
                {selectedRequest.status === 'in_progress' && (
                  <Button 
                    onClick={() => {
                      setShowResponseForm(true);
                    }}
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Respond to Request
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Response Form Modal */}
      {showResponseForm && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Respond to Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Request from {selectedRequest.userName}</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedRequest.description}</p>
              </div>
              
              <div>
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={6}
                  className="mt-2"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseText('');
                    setSelectedRequest(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleResponseSubmit}>
                  Send Response
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ConsultingManager;