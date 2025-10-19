import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Phone, Loader2, Shield, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getCurrentLocation } from '@/utils/locationUtils';
import { updateUserLocation } from '@/services/profile';

interface AuthScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const AuthScreen = ({ onBack, onComplete }: AuthScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const { signInWithGoogle, signInWithPhone, verifyPhoneOTP } = useAuth();

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);

      // Request location permission and get location
      let location = null;
      try {
        location = await getCurrentLocation();
      } catch (locError) {
        console.warn('Location permission denied or failed:', locError);
      }

      const { error } = await signInWithGoogle();

      if (!error && location) {
        // Update user location in database after successful login
        const { error: updateError } = await updateUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          city: '',
          region: '',
          country: ''
        });
        if (updateError) {
          console.error('Failed to update user location:', updateError);
        }
      }

      if (error) {
        console.error('Google auth error:', error);
        toast.error('Failed to sign in with Google');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    try {
      setIsLoading(true);
      const { confirmationResult, error } = await signInWithPhone(phone);
      
      if (error) {
        console.error('Phone auth error:', error);
        toast.error('Failed to send OTP');
        return;
      }

      if (confirmationResult) {
        setConfirmationResult(confirmationResult);
        setShowOTPInput(true);
        toast.success('OTP sent to your phone!');
      }
    } catch (error: any) {
      console.error('Phone auth error:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    try {
      setIsLoading(true);
      if (!confirmationResult) {
        toast.error('No verification request found');
        return;
      }

      const { error } = await verifyPhoneOTP(confirmationResult, otp);
      
      if (error) {
        console.error('OTP verification error:', error);
        toast.error('Invalid verification code');
      } else {
        toast.success('Phone verified successfully!');
        onComplete();
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error('Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4 animate-fade-in">
      <div className="container mx-auto max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-white/20 transition-smooth"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Welcome to FLINGZZ
          </h1>
          <p className="text-muted-foreground font-prompt text-lg">
            Sign in with Google for instant access 🚀
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-card border-0 bg-gradient-card backdrop-blur-sm hover:shadow-medium transition-smooth">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              Quick & Secure Sign In
            </CardTitle>
            <CardDescription className="text-base font-prompt">
              Works on all Android devices • Automatic fallback support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showOTPInput ? (
              <div className="space-y-6">
                {/* Google OAuth */}
              <Button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full rounded-xl h-12 font-medium"
                variant="premium"
              >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground font-prompt font-medium">
                      Or use phone
                    </span>
                  </div>
                </div>

                {/* Phone Auth */}
                <div className="space-y-4">
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 rounded-xl border-border/50 focus:border-primary transition-colors h-12"
                    />
                  </div>
                  <Button
                    onClick={handlePhoneAuth}
                    disabled={isLoading || !phone}
                    variant="outline"
                    className="w-full rounded-xl h-12 font-medium"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send OTP
                  </Button>
                </div>

                {/* Skip Option */}
                <div className="mt-4 text-center">
                  <Button
                    onClick={onComplete}
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold">Enter verification code</h2>
                  <p className="text-muted-foreground text-sm">We sent a 6-digit code to {phone}</p>
                </div>
                <div className="flex justify-center">
                  <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setShowOTPInput(false)}
                    variant="outline"
                    className="h-12 rounded-xl"
                  >
                    Back
                  </Button>
                <Button
                  onClick={handleOTPVerification}
                  disabled={isLoading || otp.length !== 6}
                  className="h-12 rounded-xl"
                  variant="premium"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={handlePhoneAuth}
                    disabled={isLoading}
                  >
                    Resend code
                  </Button>
                </div>
              </div>
            )}

            {/* reCAPTCHA container */}
            <div id="recaptcha-container"></div>

            {/* Footer */}
            <div className="mt-6 text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground font-prompt">
                <Shield className="w-4 h-4 text-success" />
                <span>Only verified users can join</span>
              </div>
              <p className="text-xs text-muted-foreground font-prompt">
                ID verification required after signup • Safe & Secure
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthScreen;