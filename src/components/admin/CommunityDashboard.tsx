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
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Import management components
import CampaignManager from './CampaignManager';
import UpdatesManager from './UpdatesManager';
import NewsManager from './NewsManager';
import ConsultingManager from './ConsultingManager';
import AnalyticsDashboard from './AnalyticsDashboard';

interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalUpdates: number;
  publishedNews: number;
  pendingConsulting: number;
  totalUsers: number;
  engagementRate: number;
  conversionRate: number;
}

type DashboardTab = 'overview' | 'campaigns' | 'updates' | 'news' | 'consulting' | 'analytics';

const CommunityDashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch consulting requests count
      const { data: consultingRequests } = await supabase
        .from('consulting_requests')
        .select('id, status')
        .eq('status', 'pending');

      // Mock data for now - replace with actual queries when tables are created
      const mockMetrics: DashboardMetrics = {
        totalCampaigns: 12,
        activeCampaigns: 3,
        totalUpdates: 8,
        publishedNews: 15,
        pendingConsulting: consultingRequests?.length || 0,
        totalUsers: 1250,
        engagementRate: 78.5,
        conversionRate: 12.3
      };

      setMetrics(mockMetrics);
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

  useEffect(() => {
    fetchMetrics();
  }, []);

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
    { 
      id: 'analytics' as DashboardTab, 
      label: 'Analytics', 
      icon: TrendingUp,
      description: 'Performance analytics and reports'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeCampaigns || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingConsulting || 0}</div>
            <p className="text-xs text-muted-foreground">
              Consulting requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.engagementRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              User engagement
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
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New campaign created</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Update published</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Consulting request received</p>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Publish Update
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Newspaper className="w-4 h-4 mr-2" />
                Write News Article
              </Button>
              <Button className="w-full justify-start" variant="outline">
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Community Management Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage campaigns, updates, news, and user consulting requests
        </p>
      </div>

        {/* Navigation Tabs */}
        <div className="w-full">
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
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {renderOverview()}
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="min-h-[400px]">
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <CampaignManager />
                </Suspense>
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="min-h-[400px]">
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <UpdatesManager />
                </Suspense>
              </div>
            )}

            {activeTab === 'news' && (
              <div className="min-h-[400px]">
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <NewsManager />
                </Suspense>
              </div>
            )}

            {activeTab === 'consulting' && (
              <div className="min-h-[400px]">
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <ConsultingManager />
                </Suspense>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="min-h-[400px]">
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <AnalyticsDashboard />
                </Suspense>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default CommunityDashboard;