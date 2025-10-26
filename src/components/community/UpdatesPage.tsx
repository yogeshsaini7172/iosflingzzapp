import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, ExternalLink } from "lucide-react";
import { getUpdatesByStatus, type Update } from "@/services/updates";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const UpdatesPage = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      // Fetch only published updates for users
      const data = await getUpdatesByStatus('published');
      setUpdates(data);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      feature: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      update: 'bg-green-500/10 text-green-500 border-green-500/20',
      announcement: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      maintenance: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    return colors[category] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Updates</h2>
        <p className="text-muted-foreground">Latest updates and announcements from FLINGZZ</p>
      </div>

      {updates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No updates at the moment. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{update.title}</CardTitle>
                  <Badge className={getCategoryColor(update.category)}>
                    {update.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {update.image_url && (
                  <img 
                    src={update.image_url} 
                    alt={update.title}
                    className="w-full h-48 object-cover rounded-md"
                  />
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-line">{update.content}</p>
                {update.tags && update.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {update.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {getTimeAgo(update.published_at || update.created_at)}
                  </div>
                  {update.external_link && (
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <a href={update.external_link} target="_blank" rel="noopener noreferrer">
                        Learn more <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpdatesPage;
