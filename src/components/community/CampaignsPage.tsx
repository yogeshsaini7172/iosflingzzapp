import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Loader2, ExternalLink } from "lucide-react";
import { getCampaignsByStatus, type Campaign } from "@/services/campaigns";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Fetch only active campaigns for users
      const data = await getCampaignsByStatus('active');
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    } catch {
      return `${start} - ${end}`;
    }
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
        <h2 className="text-2xl font-bold mb-2">Campaigns</h2>
        <p className="text-muted-foreground">Stay updated with our latest campaigns and events</p>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No active campaigns at the moment. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{campaign.title}</CardTitle>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.image_url && (
                  <img 
                    src={campaign.image_url} 
                    alt={campaign.title}
                    className="w-full h-48 object-cover rounded-md"
                  />
                )}
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDateRange(campaign.start_date, campaign.end_date)}
                  </div>
                  {campaign.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {campaign.location}
                    </div>
                  )}
                </div>
                {campaign.external_link && (
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <a href={campaign.external_link} target="_blank" rel="noopener noreferrer">
                      Learn more <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
