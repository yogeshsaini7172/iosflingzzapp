import { useState } from "react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Megaphone, MessageSquare } from "lucide-react";
import CampaignsPage from "@/components/community/CampaignsPage";
import ConsultingPage from "@/components/community/ConsultingPage";

// User-facing community page - NO admin features
type CommunityTab = 'campaigns' | 'consulting';

const CommunityPage = () => {
  // Default to campaigns tab for users (NOT overview)
  const [activeTab, setActiveTab] = useState<CommunityTab>('campaigns');

  // Only user-facing tabs (NO Overview/Admin Dashboard)
  const tabs = [
    { id: 'campaigns' as CommunityTab, label: 'Campaigns', icon: Megaphone },
    { id: 'consulting' as CommunityTab, label: 'Consulting', icon: MessageSquare },
  ];

  return (
    <UnifiedLayout title="Community">
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
          {activeTab === 'consulting' && <ConsultingPage />}
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default CommunityPage;
