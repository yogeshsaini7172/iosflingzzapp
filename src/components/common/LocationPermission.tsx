import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Navigation, 
  Globe,
  Edit3
} from 'lucide-react';
import { useLocation, LocationData } from '@/hooks/useLocation';
import { isLocationPermissionNeeded, requestLocationWithUserGesture } from '@/services/locationService';

interface LocationPermissionProps {
  onLocationUpdate?: (location: LocationData) => void;
  showCard?: boolean;
  autoFetch?: boolean;
  className?: string;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onLocationUpdate,
  showCard = true,
  autoFetch = false,
  className = ""
}) => {
  const {
    location,
    isLoading,
    error,
    hasPermission,
    permissionStatus,
    requestLocation,
    clearLocation,
    setManualLocation,
    checkPermissionStatus
  } = useLocation(false); // Don't auto-fetch, handle manually

  // Setup location request on first user interaction
  useEffect(() => {
    if (autoFetch && !location) {
      let hasTriggered = false;
      
      const triggerLocationOnInteraction = async () => {
        if (hasTriggered) return;
        hasTriggered = true;
        
        try {
          console.log('🎯 User interaction detected - triggering location popup...');
          const locationData = await requestLocation(true);
          if (locationData && onLocationUpdate) {
            onLocationUpdate(locationData);
          }
        } catch (error: any) {
          console.log('Location permission denied:', error.message);
        }
        
        // Remove event listeners after first attempt
        document.removeEventListener('click', triggerLocationOnInteraction);
        document.removeEventListener('touchstart', triggerLocationOnInteraction);
        document.removeEventListener('keydown', triggerLocationOnInteraction);
      };
      
      // Add event listeners for user interactions
      document.addEventListener('click', triggerLocationOnInteraction);
      document.addEventListener('touchstart', triggerLocationOnInteraction);
      document.addEventListener('keydown', triggerLocationOnInteraction);
      
      return () => {
        document.removeEventListener('click', triggerLocationOnInteraction);
        document.removeEventListener('touchstart', triggerLocationOnInteraction);
        document.removeEventListener('keydown', triggerLocationOnInteraction);
      };
    }
  }, [autoFetch, location, requestLocation, onLocationUpdate]);

  // Trigger callback when location is fetched
  useEffect(() => {
    if (location && onLocationUpdate) {
      onLocationUpdate(location);
    }
  }, [location, onLocationUpdate]);

  const handleLocationClick = async () => {
    if (!location && !isLoading) {
      try {
        console.log('🎯 Manual location request triggered...');
        const locationData = await requestLocation(true);
        if (locationData && onLocationUpdate) {
          onLocationUpdate(locationData);
        }
      } catch (error: any) {
        console.log('Manual location request failed:', error.message);
      }
    }
  };

  const getLocationIcon = () => {
    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (location) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (error) return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <MapPin className="w-5 h-5" />;
  };

  const getLocationSourceBadge = () => {
    if (!location) return null;
    
    const sourceConfig = {
      geolocation: { label: 'GPS', variant: 'default' as const, icon: Navigation },
      ip: { label: 'IP Location', variant: 'secondary' as const, icon: Globe },
      manual: { label: 'Manual', variant: 'outline' as const, icon: Edit3 }
    };

    const config = sourceConfig[location.source];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatLocation = (loc: LocationData) => {
    const parts = [loc.city, loc.region, loc.country].filter(Boolean);
    return parts.join(', ');
  };

  const LocationContent = () => (
    <div className="space-y-4">
      {/* Current Location Status */}
      <div 
        className={`flex items-center gap-3 ${!location ? 'cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors' : ''}`}
        onClick={handleLocationClick}
      >
        {getLocationIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Location</h3>
            {getLocationSourceBadge()}
          </div>
          {location ? (
            <p className="text-sm text-muted-foreground">
              {formatLocation(location)}
              {location.accuracy && (
                <span className="ml-2">
                  (±{Math.round(location.accuracy)}m)
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isLoading 
                ? 'Requesting location permission...' 
                : error && error.includes('denied')
                ? 'Click anywhere to allow location access'
                : !location && autoFetch
                ? 'Click anywhere to enable location detection'
                : 'Detecting your location...'
              }
            </p>
          )}
        </div>
      </div>

      {/* Location Action Prompt */}
      {!location && !isLoading && (
        <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={handleLocationClick}>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Enable Location Detection</p>
              <p className="text-xs mt-1">
                Click here to allow location access and improve your matching experience
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message - Only show for non-permission errors */}
      {error && !error.includes('denied') && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Location Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Auto Location Detection</p>
            <p>Your location is automatically detected for better matching. We only share your city and distance, never your exact coordinates.</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!showCard) {
    return <div className={className}><LocationContent /></div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LocationContent />
      </CardContent>
    </Card>
  );
};

export default LocationPermission;