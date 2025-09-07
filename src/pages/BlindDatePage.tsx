import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Heart, Users, Sparkles, GraduationCap, Star } from 'lucide-react';

interface BlindDatePageProps {
  onNavigate: (view: string) => void;
}

const BlindDatePage = ({ onNavigate }: BlindDatePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 pb-20">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center p-8 shadow-medium border-0 bg-white/80 backdrop-blur-sm border-rose-200/50">
          <CardContent>
            <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-rose-700">Blind Date Experience</h2>
            <p className="text-rose-600 mb-6">
              Connect with someone special without seeing their profile first. 
            </p>
            <p className="text-lg font-semibold text-orange-500 mb-6">
              Coming Soon! 🎭
            </p>
            <Button onClick={() => onNavigate('home')} className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-rose-200/50 z-50 shadow-lg">
        <div className="flex justify-around items-center py-2 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Heart className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('pairing')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Pairing</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('blind-date')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <div className="w-6 h-6 bg-gradient-to-r from-rose-400 to-pink-500 rounded-lg flex items-center justify-center mb-1">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium">Blind Date</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('profile')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <GraduationCap className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('subscription')}
            className="flex-col h-auto py-2 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Star className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Premium</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlindDatePage;