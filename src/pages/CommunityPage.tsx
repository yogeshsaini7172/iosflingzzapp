import { useState } from "react";
import { ArrowLeft, Megaphone, MessageSquare, Bell, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { Button } from "@/components/ui/button";
import CampaignsPage from "@/components/community/CampaignsPage";
import ConsultingPage from "@/components/community/ConsultingPage";
import UpdatesPage from "@/components/community/UpdatesPage";
import NewsPage from "@/components/community/NewsPage";

// User-facing community page - NO admin features
type CommunityTab = 'campaigns' | 'updates' | 'news' | 'consulting';

const CommunityPage = () => {
  // Default to campaigns tab for users (NOT overview)
  const [activeTab, setActiveTab] = useState<CommunityTab>('campaigns');

  // Only user-facing tabs (NO Overview/Admin Dashboard)
  const tabs = [
    { id: 'campaigns' as CommunityTab, label: 'Campaigns', icon: Megaphone },
    { id: 'updates' as CommunityTab, label: 'Updates', icon: Bell },
    { id: 'news' as CommunityTab, label: 'News', icon: Newspaper },
    { id: 'consulting' as CommunityTab, label: 'Consulting', icon: MessageSquare },
  ];

  const navigate = useNavigate();

  return (
    <UnifiedLayout title="Community">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-full p-2 hover:bg-muted/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-2xl font-bold">Community</h2>
              <p className="text-sm text-muted-foreground">Connect with campaigns and consulting</p>
            </div>
          </div>
        </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-64 border-r border-border/20 bg-card/30 backdrop-blur-sm p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Main Content - User views only */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'campaigns' && <CampaignsPage />}
          {activeTab === 'updates' && <UpdatesPage />}
          {activeTab === 'news' && <NewsPage />}
          {activeTab === 'consulting' && <ConsultingPage />}
        </div>
      </div>
      </div>
    </UnifiedLayout>
  );
};

export default CommunityPage;
