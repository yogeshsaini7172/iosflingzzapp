import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AadhaarVerificationStepProps {
  data: any;
  onChange: (data: any) => void;
  onVerificationStatusChange?: (status: 'idle' | 'pending' | 'verified' | 'failed', details?: any) => void;
}

// Extend Window interface for DigiboostSdk
declare global {
  interface Window {
    DigiboostSdk: (config: {
      gateway: 'sandbox' | 'production';
      token: string;
      selector: string;
      style?: Record<string, string>;
      onSuccess: (data: any) => void;
      onFailure: (error: any) => void;
    }) => void;
  }
}

const AadhaarVerificationStep = ({ 
  data, 
  onChange, 
  onVerificationStatusChange 
}: AadhaarVerificationStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkToken, setSdkToken] = useState<string | null>(null);
  const [gateway, setGateway] = useState<'sandbox' | 'production'>('sandbox');
  const [clientId, setClientId] = useState<string | null>(null);
  const mountRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Load Digiboost SDK
  useEffect(() => {
    const loadSDK = () => {
      if (document.querySelector('script[src*="surepass-digiboost-web-sdk"]')) {
        setSdkLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/surepassio/surepass-digiboost-web-sdk@latest/index.min.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Digiboost SDK loaded');
        setSdkLoaded(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Digiboost SDK');
        toast({
          title: "SDK Load Error",
          description: "Failed to load verification SDK. Please refresh the page.",
          variant: "destructive"
        });
      };
      document.body.appendChild(script);
    };

    loadSDK();

    return () => {
      // Cleanup script on unmount if needed
    };
  }, [toast]);

  // Initialize Digilocker and get token
  const initializeVerification = async () => {
    try {
      setIsLoading(true);
      onVerificationStatusChange?.('pending');

      console.log('🔐 Initializing Digilocker...');

      const { data: initData, error } = await supabase.functions.invoke('digilocker-init', {
        body: {
          logo_url: undefined, // Add your brand logo URL here if needed
          skip_main_screen: true,
        },
      });

      if (error) throw error;

      if (initData?.success && initData?.token) {
        console.log('✅ Digilocker initialized:', initData.client_id);
        setSdkToken(initData.token);
        setGateway(initData.gateway || 'sandbox');
        setClientId(initData.client_id);
        
        toast({
          title: "Ready to Verify",
          description: "Click the button below to start Aadhaar verification"
        });
      } else {
        throw new Error(initData?.error || 'Failed to initialize verification');
      }
    } catch (error: any) {
      console.error('Initialization error:', error);
      toast({
        title: "Initialization Failed",
        description: error.message || "Failed to initialize verification. Please try again.",
        variant: "destructive"
      });
      onVerificationStatusChange?.('failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Mount SDK when token is available
  useEffect(() => {
    if (sdkLoaded && sdkToken && !mountRef.current && window.DigiboostSdk) {
      mountRef.current = true;
      
      console.log('🚀 Mounting Digiboost SDK...');
      
      try {
        window.DigiboostSdk({
          gateway,
          token: sdkToken,
          selector: '#digilocker-button',
          style: {
            backgroundColor: 'hsl(var(--primary))',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          },
          onSuccess: async (verificationData) => {
            console.log('✅ Verification successful:', verificationData);
            
            try {
              // Download Aadhaar data
              if (clientId) {
                const { data: aadhaarData, error } = await supabase.functions.invoke('aadhaar-download', {
                  body: { client_id: clientId },
                });

                if (error) throw error;

                console.log('📥 Aadhaar data retrieved');
                
                setIsVerified(true);
                onChange({ ...data, aadhaarVerified: true, aadhaarData });
                onVerificationStatusChange?.('verified', aadhaarData);
                
                toast({
                  title: "Verified Successfully! ✅",
                  description: "Your Aadhaar has been verified successfully."
                });
              }
            } catch (downloadError: any) {
              console.error('Download error:', downloadError);
              toast({
                title: "Verification Complete",
                description: "Document uploaded but data retrieval pending. You can continue.",
              });
            }
          },
          onFailure: (error) => {
            console.log('❌ Verification failed or cancelled:', error);
            mountRef.current = false;
            
            toast({
              title: "Verification Cancelled",
              description: "You can retry verification anytime.",
            });
            onVerificationStatusChange?.('failed', error);
          },
        });
      } catch (sdkError) {
        console.error('SDK mount error:', sdkError);
        mountRef.current = false;
      }
    }
  }, [sdkLoaded, sdkToken, gateway, clientId, data, onChange, toast, onVerificationStatusChange]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Aadhaar Verification</h3>
        <p className="text-muted-foreground">Quick and secure verification using Digilocker</p>
      </div>

      {/* Why Verification */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-primary" />
            Why we verify with Aadhaar
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Government-verified digital identity</li>
            <li>• Instant verification via Digilocker</li>
            <li>• Ensures authentic community members</li>
            <li>• Your data is secure and encrypted</li>
          </ul>
        </CardContent>
      </Card>

      {/* Verification Status */}
      {isVerified ? (
        <Card className="border-success bg-success/10">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <h4 className="font-medium text-success mb-2">Verified Successfully!</h4>
            <p className="text-sm text-muted-foreground">
              Your Aadhaar has been verified. You can continue with profile setup.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Initialize Button */}
          {!sdkToken && (
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <Button
                  onClick={initializeVerification}
                  disabled={isLoading || !sdkLoaded}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : !sdkLoaded ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading SDK...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Start Aadhaar Verification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* SDK Mount Point */}
          {sdkToken && (
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div id="digilocker-button" className="w-full"></div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Click to verify with Digilocker
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Important Notes */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-orange-800">How it works</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Click the button to open Digilocker</li>
                <li>• Login with your Aadhaar-linked mobile number</li>
                <li>• Verify your identity securely</li>
                <li>• Your data is fetched directly from government servers</li>
                <li>• We never store your Aadhaar number</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AadhaarVerificationStep;
