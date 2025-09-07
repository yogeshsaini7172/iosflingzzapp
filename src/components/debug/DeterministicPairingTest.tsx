import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DeterministicPairingTest: React.FC = () => {
  const [userId, setUserId] = useState('bj3OacFNVwWjm1XQTWGM0luVg0r2');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDeterministicPairing = async () => {
    setLoading(true);
    try {
      console.log('Calling deterministic-pairing function for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('deterministic-pairing', {
        body: { user_id: userId }
      });

      if (error) {
        toast.error(`Pairing error: ${error.message}`);
        console.error('Pairing error:', error);
        return;
      }

      setResults(data);
      toast.success('Deterministic pairing completed');
      console.log('Pairing results:', data);
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Deterministic Pairing Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">User ID:</label>
            <Input 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID to test"
            />
          </div>
          
          <Button onClick={runDeterministicPairing} disabled={loading}>
            {loading ? 'Running Deterministic Pairing...' : 'Run Deterministic Pairing'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Pairing Results for {results.user1?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-3 rounded">
              <div><strong>USER1 ID:</strong> {results.user1?.id}</div>
              <div><strong>USER1 QCS:</strong> {results.user1?.qcs}</div>
              <div><strong>QCS Range:</strong> [{results.user1?.qcs_range?.join(', ')}]</div>
              <div><strong>Total Candidates Found:</strong> {results.total_candidates_found}</div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Top 10 Candidates:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.top_candidates?.map((candidate: any, index: number) => (
                  <div key={candidate.candidate_id} className="bg-muted p-3 rounded text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong>#{index + 1}: {candidate.candidate_name}</strong>
                        <div className="text-xs text-muted-foreground">
                          ID: {candidate.candidate_id}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {candidate.final_score}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><strong>Age:</strong> {candidate.candidate_age || 'N/A'}</div>
                      <div><strong>QCS:</strong> {candidate.candidate_qcs}</div>
                      <div><strong>University:</strong> {candidate.candidate_university || 'N/A'}</div>
                      <div><strong>Base Score:</strong> {candidate.deterministic_score}%</div>
                    </div>
                    
                    <div className="mt-2 text-xs">
                      <div><strong>Jitter Applied:</strong> {candidate.jitter_applied > 0 ? '+' : ''}{candidate.jitter_applied}</div>
                      {candidate.parsing_issue && (
                        <div className="text-red-600"><strong>Parsing Issue:</strong> Yes</div>
                      )}
                    </div>
                    
                    {candidate.debug_info && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600">Debug Info</summary>
                        <pre className="text-xs mt-1 bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(candidate.debug_info, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded text-sm">
              <h4 className="font-semibold">Algorithm Info:</h4>
              <div>Base Score: {results.algorithm_info?.base_score}</div>
              <div>Jitter Range: {results.algorithm_info?.jitter_range}</div>
              <div>Deterministic: {results.algorithm_info?.deterministic ? 'Yes' : 'No'}</div>
              <div>No Random Fallback: {results.algorithm_info?.no_random_fallback ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeterministicPairingTest;