import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, 
  X,
  Brain, 
  Dumbbell,
  Star,
  TrendingUp,
  Check,
  AlertCircle,
  Sparkles,
  Target,
  Award
} from 'lucide-react';

interface CompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    user_id: string;
    first_name: string;
    age?: number;
    gender?: string;
    profile_images?: string[];
    compatibility_score?: number;
    physical_score?: number;
    mental_score?: number;
    total_qcs?: number;
    matched_criteria?: string[];
    not_matched_criteria?: string[];
    interests?: string[];
    values?: string[];
    personality_type?: string;
    lifestyle?: string;
  };
  onRequestChat?: () => void;
}

const CompatibilityModal: React.FC<CompatibilityModalProps> = ({
  isOpen,
  onClose,
  profile,
  onRequestChat
}) => {
  const compatibilityScore = profile.compatibility_score || 0;
  const physicalScore = profile.physical_score || 0;
  const mentalScore = profile.mental_score || 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0">
        {/* Cover Photo Header */}
        <div className="relative h-64 overflow-hidden">
          {/* Cover Image */}
          {profile.profile_images?.[0] ? (
            <div className="absolute inset-0">
              <img 
                src={profile.profile_images[0]} 
                alt={profile.first_name}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center transition-all z-20"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Profile Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
            <div className="space-y-2">
              {/* Name & Age */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white flex items-baseline gap-2 mb-2 drop-shadow-lg">
                  {profile.first_name}
                  {profile.age && <span className="text-2xl md:text-3xl font-semibold text-white/90">{profile.age}</span>}
                </h2>
                
                {/* Gender & QCS Score */}
                <div className="flex items-center gap-2 flex-wrap">
                  {profile.gender && (
                    <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-xl border border-white/30 text-white font-semibold text-sm shadow-lg">
                      {profile.gender === 'male' ? '👨 Male' : profile.gender === 'female' ? '👩 Female' : profile.gender}
                    </div>
                  )}
                  {profile.total_qcs && (
                    <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-xl border border-white/30 text-white font-semibold text-sm shadow-lg flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      {profile.total_qcs} QCS
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Overall Compatibility Score */}
          <Card className="border-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-blue-500/5 backdrop-blur-sm" />
            <CardContent className="p-6 relative z-10">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Overall Match</h3>
                </div>
                <div className={`text-6xl font-extrabold ${getScoreColor(compatibilityScore)} tracking-tight`}>
                  {compatibilityScore}%
                </div>
                <p className="text-base font-semibold">
                  {compatibilityScore >= 80 ? '🔥 Excellent Match!' : 
                   compatibilityScore >= 60 ? '✨ Great Potential!' :
                   compatibilityScore >= 40 ? '👍 Good Compatibility' :
                   '🤔 Some Common Ground'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card className={`${getScoreBgColor(physicalScore)} border-0 shadow-md`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Physical</p>
                    <p className={`text-2xl font-bold ${getScoreColor(physicalScore)}`}>
                      {physicalScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${getScoreBgColor(mentalScore)} border-0 shadow-md`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Mental</p>
                    <p className={`text-2xl font-bold ${getScoreColor(mentalScore)}`}>
                      {mentalScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matched Criteria */}
          {profile.matched_criteria && profile.matched_criteria.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-foreground">What You Have in Common</h3>
              </div>
              <div className="backdrop-blur-xl bg-green-500/10 dark:bg-green-500/20 rounded-xl p-4 border border-green-400/40 dark:border-green-600/40 shadow-lg">
                <div className="flex flex-wrap gap-2">
                  {profile.matched_criteria.map((criteria, idx) => (
                    <Badge 
                      key={idx} 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white border-0 text-sm py-1.5 px-3 font-bold rounded-lg shadow-md"
                    >
                      ✓ {criteria.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Not Matched Criteria */}
          {profile.not_matched_criteria && profile.not_matched_criteria.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                  <AlertCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Areas of Difference</h3>
              </div>
              <div className="backdrop-blur-xl bg-orange-500/10 dark:bg-orange-500/20 rounded-xl p-4 border border-orange-400/40 dark:border-orange-600/40 shadow-lg">
                <div className="flex flex-wrap gap-2">
                  {profile.not_matched_criteria.slice(0, 6).map((criteria, idx) => (
                    <Badge 
                      key={idx} 
                      className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 text-white border-0 text-sm py-1.5 px-3 font-bold rounded-lg shadow-md"
                    >
                      {criteria.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {profile.not_matched_criteria.length > 6 && (
                    <Badge className="bg-gray-600 dark:bg-gray-500 text-white border-0 text-sm py-1.5 px-3 font-bold rounded-lg shadow-md">
                      +{profile.not_matched_criteria.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shared Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-md">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Shared Interests</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 text-foreground border border-primary/30 text-sm py-1.5 px-3 font-semibold rounded-lg hover:scale-105 transition-all"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 font-bold text-base border-2 hover:bg-muted/50"
              onClick={onClose}
            >
              <X className="w-5 h-5 mr-2" />
              Close
            </Button>
            {onRequestChat && (
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all"
                onClick={() => {
                  onRequestChat();
                  onClose();
                }}
              >
                <Heart className="w-5 h-5 mr-2 fill-white" />
                Send Request
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompatibilityModal;

