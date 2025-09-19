import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateManualQCS } from '@/utils/manualQCSCalculator';
import { calculateQCSForUser } from '@/services/test-qcs';

const QCSDiagnostics = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Sidhartha's profile data
  const sampleProfile = {
    "id": "d00fa7bd-da97-4a7c-a1f5-3b23ecf6fd50",
    "user_id": "ERZk8CGQhmRwrEdehgweidhNMel2",
    "first_name": "SIDHARTHA",
    "last_name": "NAYAK",
    "date_of_birth": "2005-02-10",
    "gender": "female",
    "bio": "CHECKING",
    "interests": ["Travel", "Reading"],
    "university": "IIT DELHI",
    "major": "COMPUTER",
    "year_of_study": 4,
    "height": 170,
    "relationship_goals": ["Serious relationship", "Casual dating"],
    "lifestyle": "active",
    "personality_type": "adventurous",
    "love_language": "words_of_affirmation",
    "body_type": "athletic",
    "skin_tone": "very_fair",
    "face_type": "oval",
    "values": "career_focused",
    "mindset": "growth",
    "field_of_study": "COMPUTER",
    "total_qcs": 60, // Current database value
    "values_array": ["career_focused"],
    "personality_traits": ["adventurous"]
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('🧮 Running QCS Diagnostics for Sidhartha...');
      
      // Calculate manual score
      const manualScore = calculateManualQCS(sampleProfile);
      
      // Calculate edge function score
      const edgeFunctionScore = await calculateQCSForUser(sampleProfile.user_id);
      
      const diagnostics = {
        manualScore,
        edgeFunctionScore,
        currentDbScore: 60,
        difference: Math.abs(manualScore - edgeFunctionScore),
        profile: sampleProfile
      };
      
      setResults(diagnostics);
      console.log('📊 Diagnostics complete:', diagnostics);
    } catch (error) {
      console.error('❌ Error in diagnostics:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>QCS Diagnostics for Sidhartha Nayak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runDiagnostics} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Running Diagnostics...' : 'Run QCS Diagnostics'}
            </Button>
            
            {results && (
              <div className="space-y-4">
                {results.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="font-semibold text-red-800">Error</h3>
                    <p className="text-red-700">{results.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Manual Calculator</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {results.manualScore}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on profile data
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Edge Function</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {results.edgeFunctionScore}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Current algorithm
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Database Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-600">
                            {results.currentDbScore}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Stored value
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded">
                      <h3 className="font-semibold mb-2">Analysis</h3>
                      <p className="text-sm">
                        <strong>Difference between algorithms:</strong> {results.difference} points
                      </p>
                      <p className="text-sm mt-1">
                        {results.difference > 5 
                          ? '❌ Significant difference detected - algorithms diverged'
                          : '✅ Algorithms are reasonably aligned'
                        }
                      </p>
                    </div>
                    
                    <details className="p-4 border rounded">
                      <summary className="font-semibold cursor-pointer">Profile Data</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(results.profile, null, 2)}
                      </pre>
                    </details>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QCSDiagnostics;