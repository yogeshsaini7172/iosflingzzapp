import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Megaphone, 
  Bell, 
  Newspaper, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Calendar,
  Eye,
  MessageCircle,
  Plus,
  Settings,
  Filter,
  Search,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Import management components
import CampaignManager from './CampaignManager';
import UpdatesManager from './UpdatesManager';
import NewsManager from './NewsManager';
import ConsultingManager from './ConsultingManager';

interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  totalUpdates: number;
  publishedUpdates: number;
  totalNews: number;
  publishedNews: number;
  pendingConsulting: number;
  totalUsers: number;
  engagementRate: number;
}

interface ActivityItem {
  type: 'campaign' | 'update' | 'news';
  title: string;
  timestamp: string;
  status: string;
  id: string;
}

type DashboardTab = 'overview' | 'campaigns' | 'updates' | 'news' | 'consulting';

const CommunityDashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if this is admin1712 portal
  const isAdmin1712Portal = typeof window !== 'undefined' && window.location.pathname.includes('admin1712');

  // Logout handler for admin1712 portal
  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    sessionStorage.removeItem('admin_authenticated');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
    // Reload page to show login screen
    window.location.reload();
  };

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns data
      const { data: campaigns } = await supabase
        .from('campaigns' as any)
        .select('id, status') as any;
      
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter((c: any) => c.status === 'active').length || 0;
      const draftCampaigns = campaigns?.filter((c: any) => c.status === 'draft').length || 0;

      // Fetch updates data
      const { data: updates } = await supabase
        .from('updates' as any)
        .select('id, status') as any;
      
      const totalUpdates = updates?.length || 0;
      const publishedUpdates = updates?.filter((u: any) => u.status === 'published').length || 0;

      // Fetch news data
      const { data: news } = await supabase
        .from('news' as any)
        .select('id, status') as any;
      
      const totalNews = news?.length || 0;
      const publishedNews = news?.filter((n: any) => n.status === 'published').length || 0;

      // Fetch consulting requests count
      const { data: consultingRequests } = await supabase
        .from('consulting_requests')
        .select('id, status')
        .eq('status', 'pending');

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Calculate engagement rate (published content vs total content)
      const totalContent = totalCampaigns + totalUpdates + totalNews;
      const publishedContent = activeCampaigns + publishedUpdates + publishedNews;
      const engagementRate = totalContent > 0 
        ? Math.round((publishedContent / totalContent) * 100) 
        : 0;

      const metricsData: DashboardMetrics = {
        totalCampaigns,
        activeCampaigns,
        draftCampaigns,
        totalUpdates,
        publishedUpdates,
        totalNews,
        publishedNews,
        pendingConsulting: consultingRequests?.length || 0,
        totalUsers: totalUsers || 0,
        engagementRate
      };

      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to load dashboard metrics');
      toast({
        title: "Error",
        description: "Failed to load dashboard metrics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      const activities: ActivityItem[] = [];

      // Fetch recent campaigns
      const { data: recentCampaigns } = await supabase
        .from('campaigns' as any)
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5) as any;

      if (recentCampaigns) {
        activities.push(...recentCampaigns.map((c: any) => ({
          type: 'campaign' as const,
          title: c.title,
          timestamp: c.created_at,
          status: c.status,
          id: c.id
        })));
      }

      // Fetch recent updates
      const { data: recentUpdates } = await supabase
        .from('updates' as any)
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5) as any;

      if (recentUpdates) {
        activities.push(...recentUpdates.map((u: any) => ({
          type: 'update' as const,
          title: u.title,
          timestamp: u.created_at,
          status: u.status,
          id: u.id
        })));
      }

      // Fetch recent news
      const { data: recentNews } = await supabase
        .from('news' as any)
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5) as any;

      if (recentNews) {
        activities.push(...recentNews.map((n: any) => ({
          type: 'news' as const,
          title: n.title,
          timestamp: n.created_at,
          status: n.status,
          id: n.id
        })));
      }

      // Sort all activities by timestamp (newest first) and take top 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchRecentActivity();
  }, []);

  // Helper function to get time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return then.toLocaleDateString();
  };

  // Helper function to get activity color
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'campaign': return 'bg-green-500';
      case 'update': return 'bg-blue-500';
      case 'news': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper function to get activity label
  const getActivityLabel = (item: ActivityItem) => {
    const statusLabel = item.status === 'published' || item.status === 'active' ? 'published' : 'created';
    switch (item.type) {
      case 'campaign': return `Campaign ${statusLabel}`;
      case 'update': return `Update ${statusLabel}`;
      case 'news': return `News article ${statusLabel}`;
      default: return 'Activity';
    }
  };

  const tabs = [
    { 
      id: 'overview' as DashboardTab, 
      label: 'Overview', 
      icon: BarChart3,
      description: 'Dashboard overview and metrics'
    },
    { 
      id: 'campaigns' as DashboardTab, 
      label: 'Campaigns', 
      icon: Megaphone,
      description: 'Manage marketing campaigns'
    },
    { 
      id: 'updates' as DashboardTab, 
      label: 'Updates', 
      icon: Bell,
      description: 'App updates and announcements'
    },
    { 
      id: 'news' as DashboardTab, 
      label: 'News', 
      icon: Newspaper,
      description: 'News articles and press releases'
    },
    { 
      id: 'consulting' as DashboardTab, 
      label: 'Consulting', 
      icon: MessageSquare,
      description: 'User consulting requests'
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Dashboard Overview</h3>
          <p className="text-sm text-muted-foreground">Real-time metrics and activity</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            fetchMetrics();
            fetchRecentActivity();
            toast({
              title: "Refreshed",
              description: "Dashboard data has been updated"
            });
          }}
        >
          <Settings className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeCampaigns || 0} active • {metrics?.draftCampaigns || 0} draft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updates</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUpdates || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.publishedUpdates || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">News Articles</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalNews || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.publishedNews || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consulting</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingConsulting || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pending requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered on platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.engagementRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Of total content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 6).map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 ${getActivityColor(item.type)} rounded-full`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getActivityLabel(item)} • {getTimeAgo(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create some content to see activity here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveTab('campaigns')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveTab('updates')}
              >
                <Bell className="w-4 h-4 mr-2" />
                Publish Update
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveTab('news')}
              >
                <Newspaper className="w-4 h-4 mr-2" />
                Write News Article
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveTab('consulting')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Review Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Community Management Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage campaigns, updates, news, and user consulting requests
          </p>
        </div>
        
        {/* Logout button for admin1712 portal */}
        {isAdmin1712Portal && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              onClick={() => {
                console.log('Tab changing from', activeTab, 'to', tab.id);
                setActiveTab(tab.id);
              }}
              className="flex items-center gap-2 text-xs sm:text-sm h-auto py-3"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {renderOverview()}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <CampaignManager />
            </Suspense>
          </div>
        )}

        {activeTab === 'updates' && (
          <div>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <UpdatesManager />
            </Suspense>
          </div>
        )}

        {activeTab === 'news' && (
          <div>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <NewsManager />
            </Suspense>
          </div>
        )}

        {activeTab === 'consulting' && (
          <div>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <ConsultingManager />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDashboard;