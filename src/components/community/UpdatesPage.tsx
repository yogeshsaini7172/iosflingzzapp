import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const UpdatesPage = () => {
  const updates = [
    {
      id: 1,
      title: "New Feature: Video Profiles",
      description: "Express yourself better with 15-second video profiles. Stand out and make meaningful connections!",
      date: "2 days ago",
      category: "Feature"
    },
    {
      id: 2,
      title: "Enhanced Compatibility Algorithm",
      description: "Our QCS system now includes personality depth analysis for better matches.",
      date: "1 week ago",
      category: "Update"
    },
    {
      id: 3,
      title: "Premium Plans Now Available",
      description: "Unlock unlimited swipes, see who liked you, and get priority matching with our new premium tiers.",
      date: "2 weeks ago",
      category: "Announcement"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Updates</h2>
        <p className="text-muted-foreground">Latest updates and announcements from FLINGZZ</p>
      </div>

      <div className="space-y-4">
        {updates.map((update) => (
          <Card key={update.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{update.title}</CardTitle>
                <Badge variant="outline">{update.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{update.description}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {update.date}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UpdatesPage;
