import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Calculator, Zap, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';

const QCSDemo = () => {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Alice's demo profile data
  const aliceProfile = {
    user_id: '11111111-1111-1111-1111-111111111001',
    first_name: 'Alice',
    last_name: 'Johnson', 
    bio: 'Love hiking and photography! Always up for new adventures 📸🏔️',
    body_type: 'athletic',
    height: 165,
    personality_type: 'adventurous',
    values: 'nature-loving',
    mindset: 'positive',
    interests: ['hiking', 'photography', 'travel', 'music'],
    university: 'Delhi University',
    college_tier: 'tier2'
  };

  const calculateQCSForAlice = async () => {
    setCalculating(true);
    try {
      // Use the advanced QCS scoring function
      const physical = `${aliceProfile.body_type} ${aliceProfile.height > 170 ? 'tall' : 'average'}`;
      const mental = `${aliceProfile.personality_type} ${aliceProfile.values} ${aliceProfile.mindset}`;
      const description = aliceProfile.bio;

      console.log('🧮 QCS Calculation Input for Alice:');
      console.log('Physical traits:', physical);
      console.log('Mental traits:', mental);
      console.log('Description:', description);

      const res = await fetchWithFirebaseAuth(
        'https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/qcs-scoring',
        {
          method: 'POST',
          body: JSON.stringify({ physical, mental, description }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to calculate QCS' }));
        throw new Error(err.error || 'Failed to calculate QCS');
      }
      const data = await res.json();

      console.log('✅ QCS Result:', data);
      setResult(data);

      toast({
        title: "QCS Calculated! 🧮",
        description: `Alice's QCS Score: ${data.qcs_score}/100`,
      });

    } catch (error: any) {
      console.error('❌ QCS Calculation Error:', error);
      toast({
        title: "Calculation Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            QCS Scoring Demo - Alice Johnson 
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alice's Profile Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Data
              </h3>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {aliceProfile.first_name} {aliceProfile.last_name}</p>
                <p><strong>Bio:</strong> {aliceProfile.bio}</p>
                <p><strong>Body Type:</strong> {aliceProfile.body_type}</p>
                <p><strong>Height:</strong> {aliceProfile.height}cm</p>
                <p><strong>Personality:</strong> {aliceProfile.personality_type}</p>
                <p><strong>Values:</strong> {aliceProfile.values}</p>
                <p><strong>Mindset:</strong> {aliceProfile.mindset}</p>
                <p><strong>Interests:</strong> {aliceProfile.interests.join(', ')}</p>
                <p><strong>University:</strong> {aliceProfile.university}</p>
                <p><strong>College Tier:</strong> {aliceProfile.college_tier}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                QCS Input Processing
              </h3>
              <div className="text-sm space-y-1">
                <p><strong>Physical Input:</strong> 
                  <code className="bg-gray-100 px-1 rounded">
                    {aliceProfile.body_type} {aliceProfile.height > 170 ? 'tall' : 'average'}
                  </code>
                </p>
                <p><strong>Mental Input:</strong> 
                  <code className="bg-gray-100 px-1 rounded">
                    {aliceProfile.personality_type} {aliceProfile.values} {aliceProfile.mindset}
                  </code>
                </p>
                <p><strong>Description:</strong> "{aliceProfile.bio}"</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={calculateQCSForAlice}
            disabled={calculating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {calculating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Calculating QCS with AI...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Calculate Alice's QCS Score
              </div>
            )}
          </Button>

          {/* Results Display */}
          {result && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  QCS Calculation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge className="text-2xl px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white">
                    Final QCS Score: {result.qcs_score}/100
                  </Badge>
                </div>

                {result.scoring_details && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Rule-based scoring */}
                    {result.scoring_details.rule_based && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700">Rule-Based Analysis</h4>
                        <p><strong>Base Score:</strong> {result.scoring_details.rule_based.base_score}</p>
                        <p><strong>Final Score:</strong> {result.scoring_details.rule_based.final_score}</p>
                        <p><strong>Persona:</strong> {result.scoring_details.rule_based.persona_detected}</p>
                        <p><strong>AI Reasoning:</strong> {result.scoring_details.rule_based.reason}</p>
                        {result.scoring_details.rule_based.behaviors && (
                          <div>
                            <strong>Detected Behaviors:</strong>
                            <ul className="list-disc list-inside text-xs">
                              {result.scoring_details.rule_based.behaviors.map((behavior: string, idx: number) => (
                                <li key={idx}>{behavior}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI-based scoring */}
                    {result.scoring_details.ai_based && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-purple-700">AI Predictive Analysis</h4>
                        <p><strong>Predicted Score:</strong> {result.scoring_details.ai_based.predicted_score}</p>
                        <p><strong>AI Insights:</strong> {result.scoring_details.ai_based.insights}</p>
                        {result.scoring_details.ai_based.red_flags && (
                          <p><strong>Red Flags:</strong> {result.scoring_details.ai_based.red_flags}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>How it works:</strong> The QCS system combines rule-based scoring with AI analysis. 
                    Physical traits, mental attributes, and bio content are weighted and cross-correlated. 
                    OpenAI then refines the score with psychological insights for the final rating.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QCSDemo;