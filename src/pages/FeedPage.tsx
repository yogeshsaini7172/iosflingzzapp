import { useProfilesFeed } from '@/hooks/useProfilesFeed';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface FeedPageProps {
  onNavigate: (view: string) => void;
}

const FeedPage = ({ onNavigate }: FeedPageProps) => {
  const { profiles, loading } = useProfilesFeed();

  if (loading) {
    return (
      <UnifiedLayout title="Feed">
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading feed...</p>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout title="Feed">
      <div className="p-4 space-y-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.profile_images?.[0]} />
                  <AvatarFallback>{profile.first_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{profile.first_name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.university}</p>
                  {profile.interests && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.interests.slice(0, 3).map((interest, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </UnifiedLayout>
  );
};

export default FeedPage;
