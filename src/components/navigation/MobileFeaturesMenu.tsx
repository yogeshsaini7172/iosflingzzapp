import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  Home, 
  Heart, 
  MessageCircle, 
  Users, 
  User,
  Eye,
  UserPlus,
  Sparkles,
  Crown,
  TestTube,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MobileFeaturesMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileFeaturesMenu: React.FC<MobileFeaturesMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      category: "Core Features",
      items: [
        { path: "/", icon: Home, label: "Home", description: "Dashboard & Overview", color: "text-blue-600" },
        { path: "/swipe", icon: Heart, label: "Swipe", description: "Discover new people", color: "text-red-500" },
        { path: "/feed", icon: Eye, label: "Feed", description: "Activity & Updates", color: "text-green-600" },
        { path: "/pairing", icon: UserPlus, label: "Pairing", description: "Smart matching system", color: "text-purple-600" },
        { path: "/matches", icon: Users, label: "Matches", description: "Your connections", color: "text-orange-600" },
        { path: "/chat", icon: MessageCircle, label: "Chat", description: "Message your matches", color: "text-blue-500" },
      ]
    },
    {
      category: "Premium Features",
      items: [
        { path: "/blind-date", icon: Sparkles, label: "Blind Date", description: "Mystery connections", color: "text-pink-600", premium: true },
        { path: "/subscription", icon: Crown, label: "Premium", description: "Upgrade your experience", color: "text-yellow-600", premium: true },
      ]
    },
    {
      category: "Profile & Settings",
      items: [
        { path: "/profile", icon: User, label: "Profile", description: "Manage your profile", color: "text-gray-600" },
      ]
    },
    {
      category: "System Tools",
      items: [
        { path: "/qcs-test", icon: TestTube, label: "QCS Test", description: "Quality Control System", color: "text-indigo-600" },
        { path: "/qcs-diagnostics", icon: Settings, label: "QCS Diagnostics", description: "System diagnostics", color: "text-cyan-600" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold">All Features</h2>
            <p className="text-sm text-muted-foreground">Explore everything FLINGZZ has to offer</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Features List */}
        <div className="p-4 space-y-6">
          {features.map((category) => (
            <div key={category.category}>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                {category.category}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {category.items.map((feature) => (
                  <Link
                    key={feature.path}
                    to={feature.path}
                    onClick={onClose}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-muted ${feature.color}`}>
                            <feature.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{feature.label}</h4>
                              {feature.premium && (
                                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Safe Area */}
        <div className="h-6 bg-card"></div>
      </div>
    </div>
  );
};

export default MobileFeaturesMenu;