import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, User, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DemoModeButtonProps {
  onActivate: () => void;
}

const DemoModeButton = ({ onActivate }: DemoModeButtonProps) => {
  const { toast } = useToast();

  const activateDemoMode = () => {
    // Create demo profile
    const demoProfile = {
      user_id: 'demo-user-' + Date.now(),
      first_name: 'Demo',
      last_name: 'User',
      email: 'demo@datesigma.com',
      date_of_birth: '2000-01-01',
      gender: 'male',
      university: 'Demo University',
      bio: 'Demo user for testing the DateSigma app!',
      profile_images: [],
      verification_status: 'verified',
      is_profile_public: true,
      total_qcs: 85
    };

    const demoPreferences = {
      user_id: demoProfile.user_id,
      preferred_gender: ['female'],
      age_range_min: 18,
      age_range_max: 25,
      preferred_relationship_goal: ['serious']
    };

    const demoQCS = {
      user_id: demoProfile.user_id,
      profile_score: 34,
      college_tier: 85,
      personality_depth: 25,
      behavior_score: 26,
      total_score: 85
    };

    // Store demo data
    localStorage.setItem('demoProfile', JSON.stringify(demoProfile));
    localStorage.setItem('demoPreferences', JSON.stringify(demoPreferences));
    localStorage.setItem('demoQCS', JSON.stringify(demoQCS));
    localStorage.setItem('demoUserId', demoProfile.user_id);
    localStorage.setItem('profile_complete', 'true');

    toast({
      title: "Demo Mode Activated! 🚀",
      description: "Welcome to DateSigma - explore all features!"
    });

    onActivate();
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-6 text-center space-y-4">
        <div className="flex justify-center space-x-2 text-2xl mb-4">
          <Zap className="w-8 h-8 text-primary animate-pulse" />
          <Heart className="w-8 h-8 text-pink-500 animate-bounce" />
          <User className="w-8 h-8 text-secondary animate-pulse" />
        </div>
        
        <h3 className="text-xl font-bold text-foreground">Try Demo Mode</h3>
        <p className="text-muted-foreground text-sm">
          Skip setup and explore DateSigma instantly with a demo profile
        </p>
        
        <Button
          onClick={activateDemoMode}
          variant="outline"
          className="w-full bg-gradient-to-r from-primary to-secondary text-white border-0 hover:shadow-lg transition-all"
        >
          <Zap className="w-4 h-4 mr-2" />
          Activate Demo Mode
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Perfect for testing and exploration
        </p>
      </CardContent>
    </Card>
  );
};

export default DemoModeButton;