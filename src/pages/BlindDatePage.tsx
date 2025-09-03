import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface BlindDatePageProps {
  onNavigate: (view: string) => void;
}

const BlindDatePage = ({ onNavigate }: BlindDatePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="text-center p-8 shadow-medium border-0">
        <CardContent>
          <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Blind Date Experience</h2>
          <p className="text-muted-foreground mb-6">
            Connect with someone special without seeing their profile first. Coming soon! 🎭
          </p>
          <Button onClick={() => onNavigate('home')} className="bg-gradient-primary">
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlindDatePage;