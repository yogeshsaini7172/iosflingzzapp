import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Globe, Edit3 } from 'lucide-react';

interface LocationDisplayProps {
  location?: string | null;
  distance?: number | null;
  showDistance?: boolean;
  showSource?: boolean;
  compact?: boolean;
  className?: string;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  distance,
  showDistance = true,
  showSource = false,
  compact = false,
  className = ""
}) => {
  if (!location) {
    return (
      <div className={`flex items-center text-muted-foreground ${className}`}>
        <MapPin className="w-4 h-4 mr-2" />
        <span className="text-sm">Location not set</span>
      </div>
    );
  }

  let locationData;
  try {
    locationData = JSON.parse(location);
  } catch {
    // Fallback for plain text location
    return (
      <div className={`flex items-center text-muted-foreground ${className}`}>
        <MapPin className="w-4 h-4 mr-2" />
        <span className="text-sm">{location}</span>
        {showDistance && distance !== null && (
          <span className="ml-2 text-xs">• {distance} km away</span>
        )}
      </div>
    );
  }

  const getLocationText = () => {
    const parts = [
      locationData.city,
      locationData.region,
      locationData.country
    ].filter(Boolean);
    
    if (compact && parts.length > 0) {
      return parts[0]; // Just city for compact display
    }
    
    return parts.join(', ') || 'Unknown location';
  };

  const getSourceIcon = () => {
    switch (locationData.source) {
      case 'geolocation':
        return <Navigation className="w-3 h-3" />;
      case 'ip':
        return <Globe className="w-3 h-3" />;
      case 'manual':
        return <Edit3 className="w-3 h-3" />;
      default:
        return <MapPin className="w-3 h-3" />;
    }
  };

  const getSourceLabel = () => {
    switch (locationData.source) {
      case 'geolocation':
        return 'GPS';
      case 'ip':
        return 'IP Location';
      case 'manual':
        return 'Manual';
      default:
        return 'Location';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
      <span className="text-sm">{getLocationText()}</span>
      
      {showDistance && distance !== null && (
        <span className="ml-2 text-xs text-muted-foreground">
          • {distance} km away
        </span>
      )}
      
      {showSource && locationData.source && (
        <Badge variant="outline" className="ml-2 text-xs">
          {getSourceIcon()}
          <span className="ml-1">{getSourceLabel()}</span>
        </Badge>
      )}
    </div>
  );
};

export default LocationDisplay;