import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Globe, Zap, Database, Wifi, Shield, Settings } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const MobileFeatureDebug: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  const getEnvironmentInfo = () => {
    const userAgent = navigator.userAgent;
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    const isCapacitor = typeof Capacitor !== 'undefined';
    
    return {
      platform,
      isNative,
      isCapacitor,
      userAgent: userAgent.substring(0, 100),
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      onLine: navigator.onLine,
    };
  };

  const checkFeatureAvailability = () => {
    const features = [
      {
        name: 'Local Storage',
        available: typeof Storage !== 'undefined' && localStorage,
        icon: Database,
        description: 'Required for user preferences and offline data'
      },
      {
        name: 'Session Storage',
        available: typeof Storage !== 'undefined' && sessionStorage,
        icon: Database,
        description: 'Required for temporary session data'
      },
      {
        name: 'Geolocation',
        available: 'geolocation' in navigator,
        icon: Settings,
        description: 'Required for location-based matching'
      },
      {
        name: 'Camera/Media',
        available: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        icon: Smartphone,
        description: 'Required for photo uploads and video chat'
      },
      {
        name: 'Push Notifications',
        available: 'Notification' in window && 'serviceWorker' in navigator,
        icon: Zap,
        description: 'Required for match and message notifications'
      },
      {
        name: 'WebSocket',
        available: 'WebSocket' in window,
        icon: Wifi,
        description: 'Required for real-time chat functionality'
      },
      {
        name: 'HTTPS',
        available: location.protocol === 'https:' || location.hostname === 'localhost',
        icon: Shield,
        description: 'Required for secure authentication and data transmission'
      }
    ];

    return features;
  };

  const env = getEnvironmentInfo();
  const features = checkFeatureAvailability();
  const availableCount = features.filter(f => f.available).length;

  if (!expanded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-card/90 backdrop-blur-sm"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          Debug ({availableCount}/{features.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 overflow-auto">
      <Card className="bg-card/95 backdrop-blur-sm border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Mobile Feature Debug
              </CardTitle>
              <CardDescription>
                Diagnostics for mobile app functionality
              </CardDescription>
            </div>
            <Button
              onClick={() => setExpanded(false)}
              variant="ghost"
              size="sm"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Info */}
          <div>
            <h3 className="font-semibold mb-3">Environment</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Platform:</span>
                <Badge variant="outline">{env.platform}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Native App:</span>
                <Badge variant={env.isNative ? "default" : "secondary"}>
                  {env.isNative ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Capacitor:</span>
                <Badge variant={env.isCapacitor ? "default" : "secondary"}>
                  {env.isCapacitor ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Screen:</span>
                <span className="text-muted-foreground">{env.screenSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Viewport:</span>
                <span className="text-muted-foreground">{env.viewportSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Connection:</span>
                <Badge variant={env.onLine ? "default" : "destructive"}>
                  {env.onLine ? `Online (${env.connection})` : "Offline"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Feature Availability */}
          <div>
            <h3 className="font-semibold mb-3">Feature Availability</h3>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex items-start gap-3">
                  <feature.icon className={`w-5 h-5 mt-0.5 ${
                    feature.available ? "text-green-600" : "text-red-500"
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{feature.name}</span>
                      <Badge variant={feature.available ? "default" : "destructive"}>
                        {feature.available ? "Available" : "Missing"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Agent */}
          <div>
            <h3 className="font-semibold mb-2">User Agent</h3>
            <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
              {env.userAgent}...
            </p>
          </div>

          {/* Missing Features Warning */}
          {availableCount < features.length && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Some features may not work properly due to missing browser capabilities.
                {!env.isNative && " Consider using the native app for full functionality."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileFeatureDebug;