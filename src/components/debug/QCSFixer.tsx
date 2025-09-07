import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const QCSFixer = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const syncAliceQCS = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('qcs-sync');

      if (error) throw error;

      console.log('QCS Sync Result:', data);
      setResult(data);

      toast({
        title: "QCS Synchronized! ✅",
        description: `Alice's QCS score updated to ${data.updated_qcs}/100`,
      });

    } catch (error: any) {
      console.error('QCS Sync Error:', error);
      toast({
        title: "Sync Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-blue-600" />
          QCS Debug & Sync Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Why Alice doesn't appear in pairing:</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>✅ Correct behavior:</strong> Alice is the current user, so she's excluded from her own feed</p>
            <p><strong>🎯 You ARE Alice:</strong> The system shows you OTHER users to match with</p>
            <p><strong>🔍 To see Alice's profile:</strong> Switch to a different demo user or view the profile section</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Current User (Alice)
            </h4>
            <p>ID: 11111111-1111-1111-1111-111111111001</p>
            <p>Status: Active, visible to others</p>
            <p>QCS Issue: Score not synced to profiles table</p>
          </div>
          
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              Available Matches
            </h4>
            <p>Bob, Emma, Mike, Sarah</p>
            <p>Sidhartha profiles (with QCS scores)</p>
            <p>All users except Alice herself</p>
          </div>
        </div>

        <Button 
          onClick={syncAliceQCS}
          disabled={syncing}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {syncing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Syncing Alice's QCS...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Fix Alice's QCS Score
            </div>
          )}
        </Button>

        {result && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  QCS Fixed: {result.updated_qcs}/100
                </Badge>
              </div>
              <p className="text-sm text-green-700 text-center">
                {result.message}
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default QCSFixer;