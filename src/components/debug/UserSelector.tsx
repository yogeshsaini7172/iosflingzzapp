import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  university?: string;
  total_qcs?: number;
}

const UserSelector: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, university, total_qcs')
        .order('first_name');

      if (error) throw error;
      
      setProfiles(data || []);
      
      // Set current user or default to first profile
      const currentUserId = localStorage.getItem("demoUserId");
      if (currentUserId && data?.find(p => p.user_id === currentUserId)) {
        setSelectedUserId(currentUserId);
      } else if (data && data.length > 0) {
        setSelectedUserId(data[0].user_id);
        localStorage.setItem("demoUserId", data[0].user_id);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    localStorage.setItem("demoUserId", userId);
    // Trigger page refresh to update all components
    window.location.reload();
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const selectedProfile = profiles.find(p => p.user_id === selectedUserId);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading profiles...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Test User Selection</span>
        </CardTitle>
        <CardDescription>
          Switch between test profiles to test the app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Test User:</label>
          <Select value={selectedUserId} onValueChange={handleUserChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.user_id} value={profile.user_id}>
                  <div className="flex items-center space-x-2">
                    <span>{profile.first_name} {profile.last_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {profile.university || 'Unknown'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProfile && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Current User:</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {selectedProfile.first_name} {selectedProfile.last_name}</p>
              <p><span className="font-medium">Email:</span> {selectedProfile.email}</p>
              <p><span className="font-medium">University:</span> {selectedProfile.university || 'Not set'}</p>
              <div className="flex items-center space-x-2">
                <span className="font-medium">QCS Score:</span>
                <Badge variant={selectedProfile.total_qcs ? 'default' : 'secondary'}>
                  {selectedProfile.total_qcs || 'Not calculated'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh App
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserSelector;