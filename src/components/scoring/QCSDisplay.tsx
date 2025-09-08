import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Brain, Zap, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';

interface QCSDisplayProps {
  userId?: string;
  showCalculateButton?: boolean;
}

interface ScoringResult {
  user_id: string;
  qcs_score: number;
  scoring_details: {
    rule_based: {
      final_score: number;
      base_score: number;
      behaviors: string[];
      persona_detected: string;
      reason: string;
    };
    ai_based: {
      predicted_score: number;
      insights: string;
      red_flags: string;
    };
  };
}

const QCSDisplay: React.FC<QCSDisplayProps> = ({ 
  userId, 
  showCalculateButton = true 
}) => {
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qcsData, setQcsData] = useState<any>(null);
  const { toast } = useToast();

  const getCurrentUserId = () => {
    return userId || localStorage.getItem("demoUserId") || "11111111-1111-1111-1111-111111111001";
  };

  const fetchQCSData = async () => {
    try {
      const currentUserId = getCurrentUserId();
      
      const { data, error } = await supabase
        .from('qcs')
        .select('*')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (!error && data) {
        setQcsData(data);
      }
    } catch (error) {
      console.error('Error fetching QCS data:', error);
    }
  };

  const calculateQCS = async () => {
    setIsLoading(true);
    
    try {
      // Call edge function with Firebase auth
      const res = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/qcs-scoring',
        {
          method: 'POST',
          body: JSON.stringify({
            // Optional: provide specific data for scoring
            physical: 'athletic fit',
            mental: 'ambitious confident creative',
            description:
              'Passionate about fitness and personal growth. Love meeting new people and trying new experiences.',
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to calculate QCS' }));
        throw new Error(err.error || 'Failed to calculate QCS');
      }

      const data = await res.json();

      setScoringResult(data);
      await fetchQCSData(); // Refresh QCS data
      
      toast({
        title: "QCS Score Calculated! 🎯",
        description: `Your Quality Control Score: ${data.qcs_score}/100`
      });

    } catch (error: any) {
      console.error('QCS calculation error:', error);
      toast({
        title: "Calculation error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchQCSData();
    }
  }, [userId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPersonaBadgeColor = (persona: string) => {
    const colors: Record<string, string> = {
      'Reliable Partner': 'bg-green-100 text-green-800',
      'Leader': 'bg-blue-100 text-blue-800',
      'Explorer': 'bg-purple-100 text-purple-800',
      'Dreamer': 'bg-pink-100 text-pink-800',
      'Thinker': 'bg-indigo-100 text-indigo-800',
      'Caregiver': 'bg-emerald-100 text-emerald-800',
      'Charmer': 'bg-orange-100 text-orange-800'
    };
    return colors[persona] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Main QCS Score Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <CardTitle>Quality Control Score (QCS)</CardTitle>
          <CardDescription>
            AI-powered compatibility and personality scoring system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qcsData ? (
            <>
              {/* Total Score Display */}
              <div className="text-center space-y-2">
                <div className={`text-6xl font-bold ${getScoreColor(qcsData.total_score || 0)}`}>
                  {qcsData.total_score || 0}
                </div>
                <div className="text-sm text-muted-foreground">out of 100</div>
                <Progress value={qcsData.total_score || 0} className="w-full" />
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <div className="text-2xl font-semibold text-blue-600">
                    {qcsData.profile_score || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Profile</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-semibold text-purple-600">
                    {qcsData.college_tier || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">College Tier</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-semibold text-green-600">
                    {qcsData.personality_depth || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Personality</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-semibold text-orange-600">
                    {qcsData.behavior_score || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Behavior</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-muted-foreground">--</div>
              <div className="text-sm text-muted-foreground">
                No QCS score calculated yet
              </div>
            </div>
          )}

          {showCalculateButton && (
            <Button 
              onClick={calculateQCS}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Calculating QCS...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Calculate My QCS Score
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {scoringResult && (
        <>
          {/* Persona & Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Personality Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getPersonaBadgeColor(scoringResult.scoring_details.rule_based.persona_detected)}>
                  {scoringResult.scoring_details.rule_based.persona_detected}
                </Badge>
                {scoringResult.scoring_details.rule_based.behaviors.map((behavior, index) => (
                  <Badge key={index} variant="outline">
                    {behavior}
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    {scoringResult.scoring_details.rule_based.reason}
                  </p>
                </div>
                
                {scoringResult.scoring_details.ai_based.insights && (
                  <div>
                    <h4 className="font-semibold text-sm">Predictive Insights</h4>
                    <p className="text-sm text-muted-foreground">
                      {scoringResult.scoring_details.ai_based.insights}
                    </p>
                  </div>
                )}

                {scoringResult.scoring_details.ai_based.red_flags && (
                  <div>
                    <h4 className="font-semibold text-sm text-red-600">Areas for Improvement</h4>
                    <p className="text-sm text-red-600">
                      {scoringResult.scoring_details.ai_based.red_flags}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scoring Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Scoring Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Rule-Based Score</h4>
                  <div className="flex items-center space-x-2">
                    <Progress value={scoringResult.scoring_details.rule_based.final_score} className="flex-1" />
                    <span className="text-lg font-semibold">
                      {scoringResult.scoring_details.rule_based.final_score}/100
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">AI Predicted Score</h4>
                  <div className="flex items-center space-x-2">
                    <Progress value={scoringResult.scoring_details.ai_based.predicted_score || 0} className="flex-1" />
                    <span className="text-lg font-semibold">
                      {scoringResult.scoring_details.ai_based.predicted_score || 0}/100
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default QCSDisplay;