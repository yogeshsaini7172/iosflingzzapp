import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Save, X, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UnifiedLayout from "@/components/layout/UnifiedLayout";

const ConsultingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editData, setEditData] = useState({
    interests: [],
    relationship_goals: [],
    bio: "",
  });
  const [newRequest, setNewRequest] = useState({
    type: "",
    description: "",
  });

  useEffect(() => {
    if (user?.uid) {
      fetchProfileData();
      fetchMyRequests();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("interests, relationship_goals, bio, first_name, last_name")
        .eq("firebase_uid", user?.uid)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfileData(data);
        setEditData({
          interests: data.interests || [],
          relationship_goals: data.relationship_goals || [],
          bio: data.bio || "",
        });
      } else {
        // No profile exists yet - this is okay, user can still submit consulting requests
        setProfileData(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Don't show error to user - profile might not exist yet
    }
  };

  const fetchMyRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("consulting_requests")
        .select("*")
        .eq("user_id", user?.uid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!user?.uid) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          interests: editData.interests,
          relationship_goals: editData.relationship_goals,
          bio: editData.bio,
        })
        .eq("firebase_uid", user.uid);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your preferences have been updated!",
      });
      setIsEditing(false);
      fetchProfileData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNewRequest = async () => {
    if (!user?.uid || !newRequest.type || !newRequest.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("consulting_requests")
        .insert({
          user_id: user.uid,
          request_type: newRequest.type,
          description: newRequest.description,
          existing_preferences: profileData,
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Our team will review your consulting request shortly.",
      });
      setShowNewForm(false);
      setNewRequest({ type: "", description: "" });
      fetchMyRequests(); // Refresh the list
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return statusStyles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <UnifiedLayout title="Consulting">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Consulting</h2>
          <p className="text-muted-foreground">
            Get personalized advice and optimize your dating experience
          </p>
        </div>

      {/* What You Want Section - Existing Profile Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>What You Want</CardTitle>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      interests: profileData?.interests || [],
                      relationship_goals: profileData?.relationship_goals || [],
                      bio: profileData?.bio || "",
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileData ? (
            <>
              <div>
                <Label className="text-sm font-medium">Interests</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.interests.join(", ")}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        interests: e.target.value.split(",").map((i) => i.trim()),
                      })
                    }
                    placeholder="Enter interests separated by commas"
                    className="mt-2"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profileData.interests?.map((interest: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Relationship Goals</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.relationship_goals.join(", ")}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        relationship_goals: e.target.value
                          .split(",")
                          .map((g) => g.trim()),
                      })
                    }
                    placeholder="Enter goals separated by commas"
                    className="mt-2"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profileData.relationship_goals?.map((goal: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.bio}
                    onChange={(e) =>
                      setEditData({ ...editData, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself"
                    className="mt-2"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    {profileData.bio || "No bio added yet"}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading your profile data...</p>
          )}
        </CardContent>
      </Card>

      {/* New Consulting Request */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>New Consulting Request</CardTitle>
            {!showNewForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            )}
          </div>
        </CardHeader>
        {showNewForm && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="request-type">Request Type</Label>
              <select
                id="request-type"
                className="w-full mt-2 p-2 border border-border rounded-md bg-background"
                value={newRequest.type}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, type: e.target.value })
                }
              >
                <option value="">Select a type</option>
                <option value="profile_optimization">Profile Optimization</option>
                <option value="matching_advice">Matching Advice</option>
                <option value="conversation_tips">Conversation Tips</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newRequest.description}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, description: e.target.value })
                }
                placeholder="Describe what you need help with..."
                className="mt-2"
                rows={6}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewForm(false);
                  setNewRequest({ type: "", description: "" });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitNewRequest} disabled={loading}>
                Submit Request
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* My Consulting Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Track your consulting requests and admin responses
          </p>
        </CardHeader>
        <CardContent>
          {myRequests.length > 0 ? (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  {/* Request Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium capitalize">
                          {request.request_type.replace(/_/g, " ")}
                        </h4>
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(request.created_at).toLocaleDateString()} at{" "}
                          {new Date(request.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Request Description */}
                  <div>
                    <Label className="text-sm font-medium">Your Request:</Label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {request.description}
                    </p>
                  </div>

                  {/* Admin Response */}
                  {request.admin_response && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <Label className="text-sm font-medium text-green-700 dark:text-green-400">
                          Admin Response:
                        </Label>
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-green-900 dark:text-green-100">
                        {request.admin_response}
                      </p>
                      {request.responded_at && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            Responded on{" "}
                            {new Date(request.responded_at).toLocaleDateString()} at{" "}
                            {new Date(request.responded_at).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Messages */}
                  {!request.admin_response && request.status === "pending" && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⏳ Your request is pending review. Our team will get back to you soon!
                      </p>
                    </div>
                  )}

                  {!request.admin_response && request.status === "in_progress" && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        🔄 Your request is being reviewed. You'll receive a response shortly!
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No consulting requests yet. Create your first request above!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </UnifiedLayout>
  );
};

export default ConsultingPage;
