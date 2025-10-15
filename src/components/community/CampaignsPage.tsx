import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";

const CampaignsPage = () => {
  const campaigns = [
    {
      id: 1,
      title: "Valentine's Week Special",
      description: "Join us for a week-long celebration with exclusive matching events and premium features!",
      date: "Feb 7-14, 2025",
      status: "upcoming",
      location: "All Universities"
    },
    {
      id: 2,
      title: "Campus Connect Drive",
      description: "We're expanding to new universities! Be part of our growing community.",
      date: "Ongoing",
      status: "active",
      location: "50+ Cities"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Campaigns</h2>
        <p className="text-muted-foreground">Stay updated with our latest campaigns and events</p>
      </div>

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
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{campaign.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {campaign.date}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {campaign.location}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CampaignsPage;
