import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  Heart,
  MessageCircle,
  User,
  Zap,
  Coffee,
} from "lucide-react";

import { useProfilesFeed } from "@/hooks/useProfilesFeed";
import { usePairing } from "@/hooks/usePairing";

interface InstagramUIProps {
  onNavigate: (view: string) => void;
}

const InstagramUI = ({ onNavigate }: InstagramUIProps) => {
  const [activeTab, setActiveTab] = useState<
    "home" | "swipe" | "pairing" | "blinddate" | "profile"
  >("home");

  // ✅ Profiles feed from Supabase (for Swipe tab)
  const { profiles = [], loading, setProfiles } = useProfilesFeed();

  // ✅ Paired profiles (for Pairing tab)
  const { pairedProfiles = [], loading: pairingLoading } = usePairing();

  // ✅ Swipe handler
  const handleSwipe = async (id: string, direction: "left" | "right") => {
    console.log(`Swiped ${direction} on profile ${id}`);
    setProfiles((prev) => prev.filter((p) => p.id !== id));

    // TODO: Save swipe action to Supabase if required
  };

  // ✅ Subscription Plans
  const plans = [
    {
      id: 1,
      name: "Basic",
      price: "₹49 / month",
      features: ["10 Swipes per day", "Basic Matching", "Chat with Matches"],
      color: "border-blue-500",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: 2,
      name: "Premium",
      price: "₹89 / month",
      features: [
        "Unlimited Swipes",
        "Smart AI Pairing",
        "Priority Matches",
        "See Who Liked You",
      ],
      color: "border-purple-500",
      buttonColor: "bg-purple-500 hover:bg-purple-600",
    },
    {
      id: 3,
      name: "Elite",
      price: "₹129 / month",
      features: [
        "Everything in Premium",
        "Exclusive Elite Profiles",
        "1 Blind Date Credit Daily",
        "VIP Support",
      ],
      color: "border-yellow-500",
      buttonColor: "bg-yellow-500 hover:bg-yellow-600",
    },
  ];

  const renderPlans = () => (
    <div className="grid gap-6">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`border-2 ${plan.color} shadow-md rounded-xl`}
        >
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-2xl font-semibold mb-4">{plan.price}</p>

            <ul className="space-y-2 mb-4 text-sm text-gray-600">
              {plan.features.map((f, idx) => (
                <li key={idx}>✅ {f}</li>
              ))}
            </ul>

            <Button
              className={`w-full text-white ${plan.buttonColor}`}
              onClick={() => alert(`Subscribed to ${plan.name}`)}
            >
              Subscribe
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ✅ Main content per tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Choose Your Plan
            </h2>
            {renderPlans()}
          </div>
        );

      case "swipe":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {loading ? (
              <h3 className="text-lg font-semibold text-gray-500">
                Loading profiles...
              </h3>
            ) : profiles.length > 0 ? (
              <div className="relative w-full max-w-sm h-[500px]">
                {profiles.map((profile, index) => (
                  <Card
                    key={profile.id}
                    className="absolute w-full h-full rounded-2xl shadow-xl overflow-hidden transition-all duration-300"
                    style={{ zIndex: profiles.length - index }}
                  >
                    <img
                      src={
                        profile.profile_images?.[0] ||
                        "https://via.placeholder.com/400"
                      }
                      alt={`${profile.first_name} ${profile.last_name}`}
                      className="w-full h-3/4 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-xl font-bold">
                        {profile.first_name} {profile.last_name},{" "}
                        {profile.date_of_birth
                          ? new Date().getFullYear() -
                            new Date(profile.date_of_birth).getFullYear()
                          : "?"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {profile.university}
                      </p>
                    </div>

                    {/* Swipe Buttons */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6">
                      <Button
                        size="lg"
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
                        onClick={() => handleSwipe(profile.id, "left")}
                      >
                        ❌
                      </Button>
                      <Button
                        size="lg"
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16"
                        onClick={() => handleSwipe(profile.id, "right")}
                      >
                        ❤️
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <h3 className="text-lg font-semibold text-gray-500">
                No more profiles to swipe 👏
              </h3>
            )}
          </div>
        );

      case "pairing":
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-2xl font-bold mb-4 text-center">✨ Smart Pairing</h2>

            {pairingLoading ? (
              <p className="text-center text-gray-500">
                Finding your perfect matches...
              </p>
            ) : pairedProfiles.length === 0 ? (
              <p className="text-center text-gray-500">
                No pairings yet. Try again later 💡
              </p>
            ) : (
              <div className="grid gap-4">
                {pairedProfiles.map((p) => (
                  <Card
                    key={p.id}
                    className="p-4 flex items-center space-x-4 shadow-md"
                  >
                    <img
                      src={p.profile_images?.[0] || "https://via.placeholder.com/150"}
                      alt={`${p.first_name} ${p.last_name}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {p.first_name} {p.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{p.university}</p>
                      <p className="text-sm">QCS Score: {p.total_qcs || "N/A"}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "blinddate":
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <h3 className="text-xl font-bold">Blind Date Page Placeholder</h3>
          </div>
        );

      case "profile":
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <h3 className="text-xl font-bold">Profile Page Placeholder</h3>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-red-500">
            ❌ Nothing to render — activeTab: {activeTab}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            DatingSigma
          </h1>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("chat")}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-around py-2">
          {[
            { id: "home", icon: Home, label: "Home", color: "text-blue-500" },
            { id: "swipe", icon: Heart, label: "Swipe", color: "text-red-500" },
            {
              id: "pairing",
              icon: Zap,
              label: "Pairing",
              color: "text-purple-500",
            },
            {
              id: "blinddate",
              icon: Coffee,
              label: "Blind Date",
              color: "text-orange-500",
            },
            {
              id: "profile",
              icon: User,
              label: "Profile",
              color: "text-green-500",
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={`flex-col space-y-1 h-auto py-2 relative ${
                activeTab === tab.id ? `${tab.color}` : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstagramUI;
