import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Filter, Heart, Users, Sparkles } from "lucide-react";
import { useFeed } from "@/hooks/useFeed";
import { PairCard } from "@/components/feed/PairCard";
import { useToast } from "@/hooks/use-toast";
import UnifiedLayout from "@/components/layout/UnifiedLayout";

interface FeedPageProps {
  onNavigate?: (view: string) => void;
}

export default function FeedPage({ onNavigate }: FeedPageProps) {
  const { items, loading, hasMore, fetchNext, refresh, swipeProfile } = useFeed(12);
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 35,
    gender: "all"
  });
  const { toast } = useToast();

  useEffect(() => {
    // Initial load
    refresh(filters);
  }, []);

  const handleSwipe = async (profile: any, type: "like" | "pass") => {
    try {
      const result = await swipeProfile(profile.profile_id, profile.user_id, type);
      
      if (result?.match) {
        toast({
          title: "🎉 It's a Match!",
          description: `You and ${profile.display_name} liked each other!`,
        });
      } else {
        toast({
          title: type === "like" ? "Liked! 💕" : "Passed 👋",
          description: type === "like" 
            ? `You liked ${profile.display_name}` 
            : `You passed on ${profile.display_name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process swipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApplyFilters = () => {
    refresh(filters);
  };

  return (
    <UnifiedLayout title="Discover">
      <div className="container mx-auto px-4 py-6">
        {/* Filters Section */}
        <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Users className="w-3 h-3 mr-1" />
                {items.length} profiles
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refresh(filters)}
              disabled={loading}
              className="hover:bg-primary/10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non_binary">Non-binary</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(filters.ageMin)} onValueChange={(value) => setFilters({...filters, ageMin: Number(value)})}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Min age" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length: 15}, (_, i) => i + 18).map(age => (
                  <SelectItem key={age} value={String(age)}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(filters.ageMax)} onValueChange={(value) => setFilters({...filters, ageMax: Number(value)})}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Max age" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length: 15}, (_, i) => i + 25).map(age => (
                  <SelectItem key={age} value={String(age)}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleApplyFilters}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <Filter className="w-4 h-4" />
              Apply
            </Button>
          </div>
        </div>
        {items.length === 0 && !loading ? (
          <Card className="text-center p-8 max-w-md mx-auto bg-card/80 backdrop-blur-sm border border-border/50 shadow-card">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">No profiles found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later for new profiles!
              </p>
              <Button onClick={() => refresh(filters)} className="bg-gradient-primary shadow-royal">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((profile) => (
                <PairCard
                  key={profile.profile_id}
                  profile={profile}
                  onSwipe={(type) => handleSwipe(profile, type)}
                />
              ))}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              {loading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading more profiles...</span>
                </div>
              ) : hasMore ? (
                <Button 
                  onClick={() => fetchNext(12, filters)}
                  className="bg-gradient-primary hover:opacity-90 shadow-royal"
                >
                  Load More Profiles
                </Button>
              ) : (
                <div className="text-muted-foreground">
                  <p>You've seen all available profiles!</p>
                  <p className="text-sm mt-1">Check back later for new matches</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </UnifiedLayout>
  );
}