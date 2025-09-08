import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Heart, Users, Sparkles, GraduationCap, Star } from 'lucide-react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

interface BlindDatePageProps {
  onNavigate: (view: string) => void;
}

const BlindDatePage = ({ onNavigate }: BlindDatePageProps) => {
  return (
    <UnifiedLayout title="Blind Date">
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="text-center p-8 shadow-card border border-border/50 bg-card/80 backdrop-blur-sm max-w-md mx-auto">
          <CardContent>
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Eye className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Blind Date Experience</h2>
            <p className="text-muted-foreground mb-6">
              Connect with someone special without seeing their profile first. 
            </p>
            <p className="text-lg font-semibold text-accent mb-6">
              Coming Soon! 🎭
            </p>
            <Button onClick={() => onNavigate('home')} className="bg-gradient-primary shadow-royal hover:opacity-90">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
};

export default BlindDatePage;