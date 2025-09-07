import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PairingDebugProps {
  userId: string;
}

const PairingDebug: React.FC<PairingDebugProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const debugPairing = async () => {
    setLoading(true);
    try {
      // First get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        toast.error(`Profile error: ${profileError.message}`);
        return;
      }

      setUserProfile(profile);

      // Call the pairing function
      const { data, error } = await supabase.functions.invoke('pairing-matches', {
        body: { 
          user_id: userId,
          limit: 5
        }
      });

      if (error) {
        toast.error(`Pairing error: ${error.message}`);
        console.error('Pairing error:', error);
        return;
      }

      setResults(data);
      toast.success('Pairing debug completed');
    } catch (error: any) {
      toast.error(`Debug failed: ${error.message}`);
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pairing Debug for User: {userId}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={debugPairing} disabled={loading}>
          {loading ? 'Debugging...' : 'Debug Pairing Calculations'}
        </Button>

        {userProfile && (
          <div className="space-y-2">
            <h3 className="font-semibold">User Profile:</h3>
            <div className="text-sm bg-muted p-3 rounded">
              <div><strong>Name:</strong> {userProfile.first_name} {userProfile.last_name}</div>
              <div><strong>QCS:</strong> {userProfile.total_qcs || 'Not set'}</div>
              <div><strong>Qualities:</strong> {JSON.stringify(userProfile.qualities, null, 2)}</div>
              <div><strong>Requirements:</strong> {JSON.stringify(userProfile.requirements, null, 2)}</div>
              <div><strong>Pairing Requests Left:</strong> {userProfile.pairing_requests_left}</div>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-2">
            <h3 className="font-semibold">Pairing Results:</h3>
            <div className="text-sm bg-muted p-3 rounded">
              <pre>{JSON.stringify(results, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const UserSelector: React.FC = () => {
  const [userId, setUserId] = useState('bj3OacFNVwWjm1XQTWGM0luVg0r2');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data: users } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, total_qcs')
      .limit(20);
    
    setAllUsers(users || []);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">User ID:</label>
            <Input 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Available Users:</h3>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {allUsers.map(user => (
                <div 
                  key={user.user_id}
                  className="flex justify-between items-center p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                  onClick={() => setUserId(user.user_id)}
                >
                  <span className="text-sm">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    QCS: {user.total_qcs || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {userId && <PairingDebug userId={userId} />}
    </div>
  );
};

export default UserSelector;