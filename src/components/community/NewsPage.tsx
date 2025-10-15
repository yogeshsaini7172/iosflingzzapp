import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const NewsPage = () => {
  const news = [
    {
      id: 1,
      title: "FLINGZZ Reaches 100K+ Active Users",
      excerpt: "We're thrilled to announce that our community has grown to over 100,000 active users across 50+ universities!",
      date: "Jan 15, 2025",
      link: "#"
    },
    {
      id: 2,
      title: "Partnership with Campus Events",
      excerpt: "FLINGZZ partners with major campus event organizers to bring you exclusive matchmaking events.",
      date: "Jan 10, 2025",
      link: "#"
    },
    {
      id: 3,
      title: "Success Stories: Real Connections",
      excerpt: "Read inspiring stories from couples who found meaningful relationships through FLINGZZ.",
      date: "Jan 5, 2025",
      link: "#"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">News</h2>
        <p className="text-muted-foreground">Latest news and press releases</p>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{item.date}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{item.excerpt}</p>
              <Button variant="link" className="p-0 h-auto">
                Read more <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
