import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export const ProfileDataChecker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkProfileData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 Checking profile data for Firebase UID:', user.uid);
      
      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/data-management',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'get_profile' })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        console.log('✅ Profile data retrieved:', data);
      } else {
        const error = await response.json();
        console.error('❌ Profile fetch failed:', error);
        toast({
          title: "Profile Check Failed",
          description: error.error || 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Profile check error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const mockProfile = {
        first_name: 'Test',
        last_name: 'User',
        email: user.email || 'test@example.com',
        date_of_birth: '1995-01-01',
        gender: 'male',
        university: 'Test University',
        bio: 'Test profile created for debugging',
        interests: ['reading', 'travel'],
      };

      const response = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/data-management',
        {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'create_profile',
            profile: mockProfile
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile created:', data);
        toast({
          title: "Profile Created",
          description: "Test profile has been created successfully"
        });
        await checkProfileData(); // Refresh data
      } else {
        const error = await response.json();
        console.error('❌ Profile creation failed:', error);
        toast({
          title: "Profile Creation Failed",
          description: error.error || 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Profile creation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkProfileData();
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile Data Checker</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="destructive">Not Authenticated</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Profile Data Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Firebase UID:</span>
          <Badge variant="outline">{user.uid}</Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={checkProfileData} 
            disabled={isLoading}
            variant="outline" 
            size="sm"
          >
            {isLoading ? 'Checking...' : 'Check Profile Data'}
          </Button>
          
          <Button 
            onClick={createProfile} 
            disabled={isLoading}
            variant="outline" 
            size="sm"
          >
            {isLoading ? 'Creating...' : 'Create Test Profile'}
          </Button>
        </div>

        {profileData && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="font-medium mb-2">Profile Data Status:</div>
            <Badge variant={profileData.success ? "default" : "destructive"}>
              {profileData.success ? "Success" : "Failed"}
            </Badge>
            
            {profileData.data?.profile && (
              <div className="mt-2 text-sm">
                <div><strong>Name:</strong> {profileData.data.profile.first_name} {profileData.data.profile.last_name}</div>
                <div><strong>Email:</strong> {profileData.data.profile.email}</div>
                <div><strong>University:</strong> {profileData.data.profile.university}</div>
                <div><strong>Firebase UID:</strong> {profileData.data.profile.firebase_uid}</div>
                <div><strong>Database ID:</strong> {profileData.data.profile.id}</div>
              </div>
            )}
            
            {!profileData.data?.profile && profileData.success && (
              <div className="mt-2 text-sm text-muted-foreground">
                No profile found in database
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};