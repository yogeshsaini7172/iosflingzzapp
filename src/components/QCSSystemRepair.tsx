import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const QCSSystemRepair = () => {
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [repairResult, setRepairResult] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnosis = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running QCS system diagnosis...');
      
      const { data, error } = await supabase.functions.invoke('qcs-system-repair', {
        body: { action: 'diagnose' }
      });

      if (error) throw error;

      setDiagnosis(data.diagnosis);
      toast({
        title: "Diagnosis Complete",
        description: `Found ${data.diagnosis.recommendations.length} issues to address`,
      });
    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
      toast({
        title: "Diagnosis Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runRepair = async () => {
    setLoading(true);
    try {
      console.log('🔧 Running QCS system repair...');
      
      const { data, error } = await supabase.functions.invoke('qcs-system-repair', {
        body: { action: 'repair' }
      });

      if (error) throw error;

      setRepairResult(data.repair_results);
      toast({
        title: "Repair Complete",
        description: `Successfully repaired ${data.repair_results.successfully_repaired} profiles`,
      });
    } catch (error) {
      console.error('❌ Repair failed:', error);
      toast({
        title: "Repair Failed", 
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testOpenAI = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-openai-connection');
      
      if (error) throw error;

      toast({
        title: data.success ? "OpenAI API Working" : "OpenAI API Failed",
        description: data.message || data.error,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "OpenAI Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QCS System Health & Repair</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button 
              onClick={runDiagnosis}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Running...' : '🔍 Diagnose Issues'}
            </Button>
            
            <Button 
              onClick={testOpenAI}
              disabled={loading}
              variant="outline" 
              className="w-full"
            >
              {loading ? 'Testing...' : '🧪 Test OpenAI API'}
            </Button>
            
            <Button 
              onClick={runRepair}
              disabled={loading || !diagnosis}
              className="w-full"
            >
              {loading ? 'Repairing...' : '🔧 Fix QCS System'}
            </Button>
          </div>

          {diagnosis && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Diagnosis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">OpenAI Status:</span>
                    <Badge variant={diagnosis.openai_status === 'working' ? 'default' : 'destructive'}>
                      {diagnosis.openai_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Atomic Function:</span>
                    <Badge variant={diagnosis.atomic_function.working ? 'default' : 'destructive'}>
                      {diagnosis.atomic_function.working ? 'Working' : 'Failed'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm">
                    <p><strong>QCS records with AI scores:</strong> {diagnosis.data_integrity.qcs_with_ai_scores}</p>
                    <p><strong>Profiles with sync times:</strong> {diagnosis.data_integrity.profiles_with_sync_time}</p>
                  </div>

                  {diagnosis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Issues Found:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {diagnosis.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-orange-600">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {repairResult && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Repair Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {repairResult.profiles_processed}
                    </div>
                    <p className="text-sm text-muted-foreground">Processed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {repairResult.successfully_repaired}
                    </div>
                    <p className="text-sm text-muted-foreground">Repaired</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {repairResult.failed}
                    </div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QCSSystemRepair;