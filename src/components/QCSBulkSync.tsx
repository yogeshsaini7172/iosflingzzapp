import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, CheckCircle, XCircle, Users, TrendingUp } from 'lucide-react';

interface SyncResult {
  total_profiles: number;
  successfully_synced: number;
  failed: number;
  timestamp: string;
  details: Array<{
    user_id: string;
    name: string;
    old_score: number;
    new_score: number;
    status: 'success' | 'failed';
    error?: string;
    logic_score?: number;
    ai_score?: number;
    psychology_score?: number;
    ai_status?: string;
  }>;
}

const QCSBulkSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const startBulkSync = async () => {
    setSyncing(true);
    setProgress(0);
    setResult(null);

    try {
      toast({
        title: "Starting QCS Bulk Sync",
        description: "This may take several minutes...",
      });

      // Start the bulk sync process
      const { data, error } = await supabase.functions.invoke('qcs-bulk-sync', {
        body: { action: 'sync_all' }
      });

      if (error) throw error;

      setResult(data);
      setProgress(100);

      toast({
        title: "QCS Bulk Sync Complete!",
        description: `Updated ${data.successfully_synced}/${data.total_profiles} profiles`,
        variant: data.failed > 0 ? "destructive" : "default",
      });

    } catch (error: any) {
      console.error('Bulk sync failed:', error);
      toast({
        title: "Bulk Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            QCS Bulk Sync System
          </CardTitle>
          <CardDescription>
            Recalculate and update QCS scores using the new comprehensive algorithm with Big-5 personality model, enhanced deterministic scoring, and AI blending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={startBulkSync} 
              disabled={syncing}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {syncing ? 'Syncing...' : 'Start Bulk Sync'}
            </Button>
            
            {syncing && (
              <div className="flex-1">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">
                  Processing profiles... {progress}%
                </p>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Total Profiles</p>
                        <p className="text-2xl font-bold">{result.total_profiles}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Successfully Synced</p>
                        <p className="text-2xl font-bold text-green-600">{result.successfully_synced}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Sync Details</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {result.details.map((detail, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(detail.status)}
                          <div>
                            <p className="font-medium">{detail.name}</p>
                            <p className="text-xs text-muted-foreground">{detail.user_id}</p>
                            {detail.status === 'success' && (
                              <div className="flex items-center gap-2 mt-1">
                                {detail.logic_score && (
                                  <Badge variant="secondary" className="text-xs">
                                    Logic: {detail.logic_score}
                                  </Badge>
                                )}
                                {detail.ai_score && (
                                  <Badge variant="secondary" className="text-xs">
                                    AI: {detail.ai_score}
                                  </Badge>
                                )}
                                {detail.psychology_score && (
                                  <Badge variant="secondary" className="text-xs">
                                    Psych: {detail.psychology_score}
                                  </Badge>
                                )}
                                {detail.ai_status && (
                                  <Badge variant="outline" className="text-xs">
                                    {detail.ai_status}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {detail.old_score} → {detail.new_score}
                          </Badge>
                          <Badge 
                            variant={detail.status === 'success' ? 'default' : 'destructive'}
                          >
                            {detail.status === 'success' ? 
                              `${detail.new_score > detail.old_score ? '+' : ''}${detail.new_score - detail.old_score}` : 
                              'Failed'
                            }
                          </Badge>
                        </div>
                      </div>
                      
                      {detail.error && (
                        <p className="text-xs text-red-500 mt-2">{detail.error}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Sync completed at: {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QCSBulkSync;