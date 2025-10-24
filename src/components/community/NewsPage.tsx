import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNewsArticlesByStatus, incrementViewCount, type NewsArticle } from "@/services/news";
import { format } from "date-fns";

const NewsPage = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // Fetch only published news for users
      const data = await getNewsArticlesByStatus('published');
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return date;
    }
  };

  const handleReadMore = async (article: NewsArticle) => {
    if (expandedId === article.id) {
      setExpandedId(null);
    } else {
      setExpandedId(article.id);
      // Increment view count when article is expanded
      try {
        await incrementViewCount(article.id);
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
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
        <h2 className="text-2xl font-bold mb-2">News</h2>
        <p className="text-muted-foreground">Latest news and press releases</p>
      </div>

      {news.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No news articles at the moment. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {news.map((article) => (
            <Card key={article.id}>
              {article.featured_image && (
                <img 
                  src={article.featured_image} 
                  alt={article.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(article.published_at || article.created_at)}
                      </p>
                      {article.author_name && (
                        <p className="text-xs text-muted-foreground">
                          by {article.author_name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {article.view_count}
                      </div>
                    </div>
                  </div>
                  {article.category && (
                    <Badge variant="secondary">{article.category}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {article.excerpt && (
                  <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                )}
                
                {expandedId === article.id && (
                  <div className="text-sm whitespace-pre-line border-t pt-3">
                    {article.content}
                  </div>
                )}

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => handleReadMore(article)}
                  >
                    {expandedId === article.id ? 'Show less' : 'Read more'}
                  </Button>
                  
                  {article.external_link && (
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <a href={article.external_link} target="_blank" rel="noopener noreferrer">
                        External link <ExternalLink className="w-3 h-3 ml-1" />
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

export default NewsPage;
