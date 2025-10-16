import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Globe, Edit3 } from 'lucide-react';
import LocationPermission from '@/components/common/LocationPermission';
import { LocationData } from '@/hooks/useLocation';

interface LocationStepProps {
  profileData: any;
  setProfileData: (data: any) => void;
}

const LocationStep: React.FC<LocationStepProps> = ({
  profileData,
  setProfileData
}) => {
  const handleLocationUpdate = (location: LocationData) => {
    setProfileData((prev: any) => ({
      ...prev,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        region: location.region,
        country: location.country,
        address: location.address,
        source: location.source
      }
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-gradient-primary mb-2">
          Share Your Location
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Help others find you and discover people nearby. Your location helps us show distance and improve matching.
        </p>
      </div>

      {/* Benefits Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Why share your location?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Navigation className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1">Better Matches</h4>
              <p className="text-xs text-muted-foreground">
                Find people nearby who share your interests
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1">Show Distance</h4>
              <p className="text-xs text-muted-foreground">
                Let others know how far you are
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Edit3 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1">Full Control</h4>
              <p className="text-xs text-muted-foreground">
                Update or remove anytime in settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Location Display */}
      {profileData.location && (
        <Card className="bg-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Location Set</h3>
                <p className="text-sm text-muted-foreground">
                  {[
                    profileData.location.city,
                    profileData.location.region,
                    profileData.location.country
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {profileData.location.source === 'geolocation' && (
                  <>
                    <Navigation className="w-3 h-3 mr-1" />
                    GPS
                  </>
                )}
                {profileData.location.source === 'ip' && (
                  <>
                    <Globe className="w-3 h-3 mr-1" />
                    IP Location
                  </>
                )}
                {profileData.location.source === 'manual' && (
                  <>
                    <Edit3 className="w-3 h-3 mr-1" />
                    Manual
                  </>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Permission Component */}
      <LocationPermission
        onLocationUpdate={handleLocationUpdate}
        showCard={false}
        autoFetch={true}
        className="space-y-4"
      />

      {/* Privacy Notice */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Privacy & Security</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Your exact location is never shared - only city and distance</li>
                <li>• You can skip this step and add location later</li>
                <li>• Location can be updated or removed anytime in settings</li>
                <li>• We use location to improve matching and show relevant profiles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationStep;