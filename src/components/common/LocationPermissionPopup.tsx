import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  AlertTriangle, 
  Settings, 
  Chrome, 
  X,
  CheckCircle,
  Navigation
} from 'lucide-react';

interface LocationPermissionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onManualEntry: () => void;
}

const LocationPermissionPopup: React.FC<LocationPermissionPopupProps> = ({
  isOpen,
  onClose,
  onRetry,
  onManualEntry
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Browser';
  };

  const getLocationInstructions = () => {
    const browser = getBrowserName();
    
    switch (browser) {
      case 'Chrome':
        return [
          'Click the location icon 📍 in the address bar',
          'Select "Always allow" for this site',
          'Refresh the page and try again'
        ];
      case 'Firefox':
        return [
          'Click the shield icon in the address bar',
          'Click "Allow Location Access"',
          'Refresh the page and try again'
        ];
      case 'Safari':
        return [
          'Go to Safari → Settings → Websites',
          'Find "Location" and set this site to "Allow"',
          'Refresh the page and try again'
        ];
      default:
        return [
          'Look for a location/permission icon in your address bar',
          'Allow location access for this site',
          'Refresh the page and try again'
        ];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Location Access Needed
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              We need location access to show your distance to other users and improve matching.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Choose how to set your location:</h4>
            
            <div className="space-y-2">
              <Button 
                onClick={onRetry}
                className="w-full justify-start gap-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                variant="outline"
              >
                <Navigation className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">Allow GPS Location</div>
                  <div className="text-xs opacity-70">Most accurate • Auto-updates</div>
                </div>
                <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-xs">
                  Recommended
                </Badge>
              </Button>

              <Button 
                onClick={onManualEntry}
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <MapPin className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">Enter Manually</div>
                  <div className="text-xs text-muted-foreground">Type your city and country</div>
                </div>
              </Button>
            </div>
          </div>

          {!showInstructions ? (
            <Button 
              variant="ghost" 
              onClick={() => setShowInstructions(true)}
              className="w-full text-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              How to enable location access
            </Button>
          ) : (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Chrome className="w-4 h-4" />
                <span className="font-medium text-sm">Enable location in {getBrowserName()}</span>
              </div>
              <ol className="text-sm space-y-1 text-muted-foreground">
                {getLocationInstructions().map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="font-medium text-primary">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <Button
                variant="ghost"
                onClick={() => setShowInstructions(false)}
                className="w-full text-xs"
              >
                Hide instructions
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Privacy Protected</p>
                <p>We only share your city and distance, never your exact location.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermissionPopup;