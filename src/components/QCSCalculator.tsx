import { useEffect, useState } from 'react';
import { calculateQCSForUser } from '@/services/test-qcs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const QCSCalculator = () => {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  
  const targetUserId = 'qKWmi3xeOvVbdUzUfyghkwejzZE2';

  const handleCalculateQCS = async () => {
    setCalculating(true);
    setResult(null);
    
    try {
      console.log(`🔄 Starting QCS calculation for user: ${targetUserId}`);
      toast.info(`Starting QCS calculation for user: ${targetUserId}`);
      
      const score = await calculateQCSForUser(targetUserId);
      
      setResult(score);
      console.log(`✅ QCS calculation complete: ${score}`);
      toast.success(`QCS calculated successfully: ${score}`);
    } catch (error) {
      console.error('❌ QCS calculation failed:', error);
      toast.error('QCS calculation failed. Check console for details.');
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    // Automatically trigger calculation on component mount
    handleCalculateQCS();
  }, []);

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">QCS Calculator</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">User ID:</p>
          <p className="font-mono text-xs bg-muted p-2 rounded break-all">
            {targetUserId}
          </p>
        </div>

        <Button 
          onClick={handleCalculateQCS} 
          disabled={calculating}
          className="w-full"
        >
          {calculating ? 'Calculating...' : 'Calculate QCS'}
        </Button>

        {result !== null && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <h3 className="font-semibold text-primary mb-2">QCS Result</h3>
            <p className="text-2xl font-bold text-primary">{result}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QCSCalculator;