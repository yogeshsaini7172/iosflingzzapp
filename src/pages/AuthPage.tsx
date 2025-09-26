import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, ArrowLeft, ArrowRight } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { preventRedirectAuth, showMobileAuthRecommendation } from '@/utils/mobileAuthFix';
import { toast } from 'sonner';

interface AuthPageProps {
  onBack?: () => void;
  onComplete?: () => void;
}

const AuthPage = ({ onBack, onComplete }: AuthPageProps = {}) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'select' | 'phone-otp' | 'verify-otp'>('select');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isMobileBlocked, setIsMobileBlocked] = useState(false);
  
  const { user, signInWithGoogle, signInWithPhone, verifyPhoneOTP } = useAuth();
  const digits = phone.replace(/\D/g, '');
  const isValidPhone = digits.length === 10 || (/^\+91\d{10}$/.test(phone.replace(/\s/g, ''))) || (digits.length === 12 && digits.startsWith('91'));

  useEffect(() => {
    if (user && onComplete) {
      onComplete();
    }
  }, [user, onComplete]);

  // Clean up reCAPTCHA on component unmount
  useEffect(() => {
    return () => {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    const blocked = preventRedirectAuth();
    setIsMobileBlocked(blocked);
    if (blocked) {
      showMobileAuthRecommendation();
    }
  }, []);

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) {
      toast.error('Enter a valid Indian mobile number');
      return;
    }

    // Clear any existing reCAPTCHA
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (recaptchaContainer) {
      recaptchaContainer.innerHTML = '';
    }

    setIsLoading(true);
    try {
      const { error, confirmationResult: result } = await signInWithPhone(phone);
      if (!error && result) {
        setConfirmationResult(result);
        setAuthStep('verify-otp');
      }
    } catch (error) {
      console.error('Phone auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (!otp || !confirmationResult) return;

    setIsLoading(true);
    
    try {
      const { error } = await verifyPhoneOTP(confirmationResult, otp);
      if (!error && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      if (!error && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authStep === 'verify-otp') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4"
              onClick={() => {
                setAuthStep('select');
                setOtp('');
                setConfirmationResult(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Verify Phone Number</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
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
            
            <Button 
              onClick={handleOTPVerification}
              disabled={otp.length !== 6 || isLoading}
              className="w-full"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handlePhoneAuth(new Event('submit') as any)}
              disabled={isLoading}
              className="w-full"
            >
              Resend Code
            </Button>
            
            <div id="recaptcha-container"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authStep === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4"
                onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <img src="/logo.png" alt="Logo" className="w-14 h-14 mx-auto mb-4" />
            <CardTitle>Welcome to <span className="drop-shadow-md hover:scale-105 text-pink-400 transition-all duration-300 animate-gradient-shadow">
      FLINGZZ
    </span></CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
{/* Always show Google Sign-In button - Firebase can handle mobile auth */}
<Button 
  variant="outline" 
  onClick={handleGoogleAuth}
  disabled={isLoading}
  className="w-full h-12 text-base"
>
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    {isLoading ? 'Connecting...' : 'Continue with Google'}
  </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => setAuthStep('phone-otp')}
              className="w-full h-12 text-base"
            >
              <Phone className="w-5 h-5 mr-3" />
              Continue with Phone
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              By continuing, you agree to our{' '}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authStep === 'phone-otp') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 left-0"
              onClick={() => setAuthStep('select')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Phone Number</CardTitle>
            <CardDescription>
              Enter your phone number to receive a verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter 10-digit number; we auto-apply +91 for India
                </p>
              </div>
              
              <Button type="submit" disabled={isLoading || !isValidPhone} className="w-full">
                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <div id="recaptcha-container"></div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 left-0"
            onClick={() => {
              setAuthStep('select');
              setOtp('');
              setConfirmationResult(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Verify Phone Number</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your phone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
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
          
          <Button 
            onClick={handleOTPVerification}
            disabled={otp.length !== 6 || isLoading}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => handlePhoneAuth(new Event('submit') as any)}
            disabled={isLoading}
            className="w-full"
          >
            Resend Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;